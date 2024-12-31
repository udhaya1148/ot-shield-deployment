from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import socket
import os
import subprocess
import yaml
import glob
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_physical_interfaces():
    """
    Retrieves a list of physical network interfaces available on the system.
    """
    try:
        # Get all network interfaces using ls command
        result = subprocess.run(['ls', '/sys/class/net'], stdout=subprocess.PIPE, text=True)
        interfaces = result.stdout.strip().split('\n')

        physical_interfaces = []
        for interface in interfaces:
            interface_path = f"/sys/class/net/{interface}/device"
            if os.path.exists(interface_path):  # Check if it's a physical interface
                physical_interfaces.append(interface)
        
        return physical_interfaces
    except Exception as e:
        print(f"Error occurred while retrieving interfaces: {e}")
        return []

def subnet_to_cidr(subnet):
    netmask = list(map(int, subnet.split('.')))
    return sum(bin(x).count('1') for x in netmask)

def get_gateway_from_route(interface):
    """Fetch the gateway for a specific interface using the 'ip route' command."""
    try:
        # Run the 'ip route' command and capture its output
        result = subprocess.run(['ip', 'route'], stdout=subprocess.PIPE, text=True)
        output = result.stdout

        # Iterate through each line in the routing table
        for line in output.splitlines():
            # Check if the line contains the interface name
            if interface in line:
                # Extract and return the gateway from the line
                parts = line.split()
                for i in range(len(parts)):
                    if parts[i] == 'via':
                        return parts[i + 1]
    except Exception as e:
        print(f"Error fetching gateway for {interface}: {e}")
    
    return "-"  # Return '-' if no gateway is found

def get_route_metric(interface):
    """Fetch the metric for a specific interface using the 'ip route' command."""
    try:
        # Run the 'ip route' command and capture its output
        result = subprocess.run(['ip', 'route'], stdout=subprocess.PIPE, text=True)
        output = result.stdout

        # Iterate through each line in the routing table
        for line in output.splitlines():
            # Check if the line contains the interface name
            if interface in line:
                # Extract and return the metric
                parts = line.split()
                for i in range(len(parts)):
                    if parts[i] == 'metric':
                        return parts[i + 1]  # Return the metric value
    except Exception as e:
        print(f"Error fetching route metric for {interface}: {e}")
    



def get_dns_for_interface(interface):
    """Fetch DNS information for a specific interface using resolvectl."""
    try:
        result = subprocess.run(['resolvectl', 'status', interface], stdout=subprocess.PIPE, text=True)
        output = result.stdout

        # Parse DNS Servers
        dns_servers = []
        for line in output.splitlines():
            if "DNS Servers" in line:
                dns_servers.extend(line.split("DNS Servers:")[1].strip().split())
        return ', '.join(dns_servers) if dns_servers else "-"
    except Exception as e:
        print(f"Error fetching DNS for {interface}: {e}")
        return "-"

def get_available_interfaces():
    """Fetch available network interfaces using the custom method."""
    interfaces = {}
    physical_interfaces = get_physical_interfaces()

    for interface in physical_interfaces:
        try:
            # Get interface details using ip command
            result = subprocess.run(['ip', 'addr', 'show', interface], stdout=subprocess.PIPE, text=True)
            output = result.stdout
            
            # Extract IP address and subnet
            ip = None
            subnet = None
            for line in output.splitlines():
                if 'inet ' in line:
                    parts = line.strip().split()
                    ip = parts[1].split('/')[0]
                    subnet = parts[1].split('/')[1]
                    break

            # Fetch gateway using route
            gateway = get_gateway_from_route(interface)

            # Fetch metric for the route
            metric = get_route_metric(interface)
            
            # Fetch DNS using resolvectl
            dns = get_dns_for_interface(interface)

            interface_info = {
                "Status": "Up" if "state UP" in output else "Down",
                "IP Address": ip if ip else None,
                "Subnet Mask": subnet if subnet else None,
                "DHCP Status": "Unknown",  # Will fetch from Netplan
                "Gateway": gateway if gateway != "-" else None,
                "DNS": dns if dns != "-" else None,
                "Metric": metric if metric else None,
            }

            # Only add non-None values to the interface dictionary
            interfaces[interface] = {k: v for k, v in interface_info.items() if v is not None}

        except Exception as e:
            print(f"Error fetching details for interface {interface}: {e}")

    return interfaces


def enrich_with_netplan(interfaces):
    """Fetch additional details from Netplan and enrich interface data."""
    netplan_config_path = '/etc/netplan'
    try:
        for yaml_file in glob.glob(os.path.join(netplan_config_path, '*.yaml')):
            with open(yaml_file, 'r') as f:
                config = yaml.safe_load(f)
                for iface, settings in config['network']['ethernets'].items():
                    if iface in interfaces:
                        interfaces[iface]["DHCP Status"] = "DHCP" if settings.get('dhcp4', False) else "Manual"
                        if 'routes' in settings:
                            # Add route details (to, via, metric) into the interface's details
                            routes = []
                            for route in settings['routes']:
                                route_details = {
                                    'to': route.get('to', ''),
                                    'via': route.get('via', ''),
                                    'metric': route.get('metric', '')
                                }
                                routes.append(route_details)
                            interfaces[iface]["Routes"] = routes  # Add the routes field
                        else:
                            interfaces[iface]["Routes"] = []  # No routes defined
                        if 'nameservers' in settings:
                            dns_addresses = settings['nameservers'].get('addresses', [])
                            interfaces[iface]["DNS"] = ', '.join(dns_addresses)
    except Exception as e:
        print(f"Error reading Netplan configuration: {e}")

    return interfaces


@app.route('/network-info', methods=['GET'])
def network_info():
    interfaces = get_available_interfaces()
    enriched_interfaces = enrich_with_netplan(interfaces)
    return jsonify({"network_info": enriched_interfaces})



def is_valid_ip(ip):
    """Validate if the given string is a valid IPv4 address."""
    try:
        socket.inet_aton(ip)
        return True
    except socket.error:
        return False

@app.route('/update-network', methods=['POST'])
def update_network():
    """
    Updates the network configuration for a given interface based on the provided
    JSON payload.
    """
    data = request.json
    interface = data.get('interface')
    ip = data.get('ip')
    subnet = data.get('subnet')
    gateway = data.get('gateway', None)
    dns_servers = data.get('dns', None)
    dhcp_enabled = data.get('dhcp', None)
    routes = data.get('routes', [])
    metric = data.get('metric', None)

    if not metric:
        metric = 100  # Set default metric if not provided

    try:
        # Validation
        if not interface:
            return jsonify({'status': 'error', 'message': 'Interface is required.'}), 400
        if not dhcp_enabled:
            if not ip or not subnet:
                return jsonify({'status': 'error', 'message': 'IP address and subnet are required when DHCP is disabled.'}), 400
            if not is_valid_ip(ip):
                return jsonify({'status': 'error', 'message': 'Invalid IP address.'}), 400

        # Handle validation for optional fields like gateway, DNS, and routes
        if gateway and not is_valid_ip(gateway):
            gateway = None  # Ignore invalid gateway if provided
        if dns_servers:
            valid_dns = [dns for dns in dns_servers if is_valid_ip(dns)]
            invalid_dns = [dns for dns in dns_servers if dns not in valid_dns]
        else:
            valid_dns = []
            invalid_dns = []

        # Skip route validation if gateway is not provided
        if gateway and not routes:
            return jsonify({'status': 'error', 'message': 'Routes are required when providing a gateway.'}), 400

        # Proceed with valid inputs only
        netplan_files = glob.glob('/etc/netplan/*.yaml')
        if not netplan_files:
            return jsonify({'status': 'error', 'message': 'No Netplan configuration files found.'}), 400

        netplan_config_path = netplan_files[0]
        with open(netplan_config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Ensure the 'ethernets' key exists
        config.setdefault('network', {}).setdefault('ethernets', {})
        interface_config = config['network']['ethernets'].setdefault(interface, {})

        if dhcp_enabled:
            # Enable DHCP and clear static configurations
            interface_config['dhcp4'] = True
            interface_config['dhcp6'] = True
            interface_config.pop('addresses', None)
            interface_config.pop('nameservers', None)
            interface_config.pop('routes', None)
        else:
            # Handle subnet mask and CIDR notation
            if '/' in subnet:
                cidr = subnet.split('/')[1]
            elif subnet.count('.') == 3:
                cidr = subnet_to_cidr(subnet)
            elif subnet.isdigit() and 0 <= int(subnet) <= 32:
                cidr = subnet
            else:
                return jsonify({'status': 'error', 'message': 'Invalid subnet format.'}), 400

            # Update static IP configuration
            interface_config['dhcp4'] = False
            interface_config['dhcp6'] = False
            interface_config['addresses'] = [f"{ip}/{cidr}"]

            # Handle DNS configuration
            if valid_dns:
                interface_config['nameservers'] = {'addresses': valid_dns}
            else:
                interface_config.pop('nameservers', None)

            # Handle Gateway configuration (optional)
            if routes:
                interface_config['routes'] = [{'to': route, 'via': gateway, 'metric': metric} for route in routes]
            else:
                if gateway:  # If a gateway is provided but no routes, add default route
                    interface_config['routes'] = [{'to': 'default', 'via': gateway, 'metric': metric}]
                else:
                    interface_config.pop('routes', None)

        # Write back the updated configuration
        with open(netplan_config_path, 'w') as f:
            yaml.dump(config, f)

        # Apply the changes using Netplan
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)

        # Bring up the interface if it's down
        subprocess.run(['sudo', 'ip', 'link', 'set', interface, 'up'], check=False)

        # Generate success message
        messages = ['Network configuration updated successfully.']
        if invalid_dns:
            messages.append(f"Invalid DNS server(s) ignored: {', '.join(invalid_dns)}.")

        return jsonify({'status': 'success', 'message': ' '.join(messages)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


def check_os_version():
    """Check the OS version and return it."""
    try:
        with open("/etc/os-release") as f:
            os_info = {}
            for line in f:
                key, value = line.strip().split("=", 1)
                os_info[key] = value.strip('"')
            return os_info.get("VERSION_ID", "Unknown")
    except Exception as e:
        print(f"Error checking OS version: {e}")
        return "Unknown"

def setup_network_for_first_time():
    """Set up network configuration for the first installation."""
    try:
        print("Configuring network for the first time...")
        
        # Define the marker file to check for first-time setup
        marker_file = "/etc/netplan/setup_done.marker"
        
        # If the marker file exists, skip setup
        if os.path.exists(marker_file):
            print("Network setup has already been performed. Skipping configuration.")
            return

        # Define Netplan directory and new configuration path
        netplan_dir = "/etc/netplan"
        new_netplan_config_path = "/etc/netplan/01-netconfig.yaml"

        # Delete all existing Netplan configuration files
        for file in glob.glob(os.path.join(netplan_dir, "*.yaml")):
            try:
                os.remove(file)
                print(f"Deleted existing Netplan file: {file}")
            except Exception as delete_error:
                print(f"Failed to delete {file}: {delete_error}")

        # Disable Network Configuration in Cloud-Init
        with open("/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg", "w") as f:
            f.write("network: {config: disabled}\n")
        
        # Create a new default Netplan configuration
        netplan_config = """
network:
  ethernets:
    enp1s0:
      addresses:
      - 192.168.4.1/24
      dhcp4: false
      dhcp6: false
    enp2s0:
      dhcp4: true
      dhcp6: true
    enp3s0:
      dhcp4: true
      dhcp6: true
    enp4s0:
      dhcp4: true
      dhcp6: true
    enp6s0f0:
      addresses:
      - 10.1.1.1/30
      dhcp4: false
      dhcp6: false
      routes:
      - metric: 100
        to: 255.255.255.255/32
        via: 10.1.1.1
  version: 2
"""
        with open(new_netplan_config_path, "w") as f:
            f.write(netplan_config)
        print(f"Created new Netplan configuration: {new_netplan_config_path}")
        
        # Apply the new configuration using Netplan
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)
        print("Network configuration applied successfully.")
        
        # Create the marker file to indicate setup completion
        with open(marker_file, "w") as f:
            f.write("Setup completed successfully.\n")
        print("Setup marker file created.")
    except Exception as e:
        print(f"Error during network setup: {e}")




if __name__ == "__main__":
    print("Initializing network configuration setup...")
    setup_network_for_first_time()
    
    script_filename = os.path.basename(__file__).replace('.py', '')
    app_module = f"{script_filename}:app"

    subprocess.run([
        'gunicorn',
        '-w', '4',          # Number of worker processes
        '-b', '0.0.0.0:5001', # Bind to 0.0.0.0:5001
        app_module           # Pass the module name dynamically
    ])
