from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import socket
import os
import subprocess
import yaml
import glob
import ipaddress
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

def is_gateway_reachable(interface, gateway):
    """Check if the gateway is directly reachable from the given interface."""
    try:
        result = subprocess.run(['ip', 'route', 'get', gateway], capture_output=True, text=True)
        output = result.stdout.strip()

        # Ensure the interface is the expected one and gateway is reachable
        if interface in output and "via" not in output:
            return True  # Directly reachable
        
        return False  # Gateway is not directly reachable
    except Exception:
        return False

def is_valid_gateway(interface, ip, subnet, gateway):
    """Validate if the gateway is within the subnet range OR is already in routing table."""
    if not gateway:
        return True  # No gateway, no validation needed

    try:
        # Check if gateway is in the subnet
        network = ipaddress.IPv4Network(f"{ip}/{subnet}", strict=False)
        if ipaddress.IPv4Address(gateway) in network:
            return True  # Gateway is valid in subnet
        
        # Check if the gateway is already in the routing table
        result = subprocess.run(['ip', 'route', 'show'], capture_output=True, text=True)
        if gateway in result.stdout:
            return True  # Gateway is already used in routes
        
        return False  # Gateway not in subnet and not in route table
    except ValueError:
        return False  # Invalid IP or subnet
   
def validate_route_with_gateway(interface, route):
    """Validate if the route gateway is reachable from the given interface."""
    if 'via' in route:
        gateway = route['via']
        if not is_valid_ip(gateway):
            return False  # Invalid gateway
        if not is_gateway_reachable(interface, gateway):
            return False  # Gateway is not reachable
    return True

def run_command(command):
    """Run a shell command and capture meaningful errors."""
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return e.stderr.strip()
    
def get_existing_routes():
    """Retrieve all existing routes from all netplan configurations."""
    existing_routes = {}
    for file in os.listdir("/etc/netplan/"):
        if file.endswith(".yaml") or file.endswith(".yml"):
            try:
                with open(f"/etc/netplan/{file}", "r") as f:
                    config = yaml.safe_load(f) or {}
                    ethernets = config.get("network", {}).get("ethernets", {})
                    for iface, iface_config in ethernets.items():
                        routes = iface_config.get("routes", [])
                        for route in routes:
                            key = (route.get("to"), route.get("via"))
                            existing_routes[key] = iface
                            print(f"Existing route: {key} via {iface}")  # Debugging log
            except Exception:
                continue
    return existing_routes

@app.route('/update-network', methods=['POST'])
def update_network():
    data = request.json
    interface = data.get('interface')
    ip = data.get('ip')
    subnet = data.get('subnet')
    gateway = data.get('gateway', None)
    routes = data.get('routes', [])  
    routes_to_remove = data.get('remove_routes', [])  
    remove_default = data.get('remove_default', False)  
    remove_static = data.get('remove_static', False)  
    dns_servers = data.get('dns', None)
    dhcp_enabled = data.get('dhcp', None)
    default_metric = data.get('metric', 100)  

    try:
        if not interface:
            return jsonify({'status': 'error', 'message': 'Interface is required.'}), 400
        if not dhcp_enabled and (not ip or not subnet):
            return jsonify({'status': 'error', 'message': 'IP address and subnet are required when DHCP is disabled.'}), 400
        if gateway and not is_valid_gateway(interface, ip, subnet, gateway):
            return jsonify({'status': 'error', 'message': 'Invalid or unreachable gateway.'}), 400

        # Fetch existing routes from all interfaces
        existing_routes = get_existing_routes()

        # Check if a default route exists on any `enp{number}s0` interface and store the matching interface
        existing_iface = None

        for (to_network, via_gateway), iface in existing_routes.items():
            if to_network == "default" and re.match(r"enp\d+s0", iface):
                existing_iface = iface  # Store the interface name
                break  # Stop looping once a default gateway is found

        # Only block if a new default gateway is being added
        if existing_iface and gateway and not routes and not routes_to_remove and not remove_static:
            return jsonify({
                "status": "error",
                "message": f"Default Gateway already exists on {existing_iface}. You must delete the existing default Gateway before adding a new one."
            }), 400

        # Validate and process routes
        for route in routes:
            to_network = route.get("to")
            via_gateway = route.get("via", None)

            # Skip if `via_gateway` is not provided
            if not via_gateway:
                continue  

            # Skip default route handling here (it will be handled separately)
            if to_network == "default":
                continue  

            if not is_valid_ip(via_gateway):
                return jsonify({'status': 'error', 'message': f'Invalid gateway IP for route {to_network}.'}), 400

            # Check if route already exists on another interface with the same gateway
            existing_route = existing_routes.get((to_network, via_gateway))

            if existing_route:
                if existing_route != interface:
                    return jsonify({
                        "status": "error",
                        "message": f"Route {to_network} via {via_gateway} already exists on interface {existing_route}."
                    }), 400

            # Skip gateway validation if route already exists
            # Ensure the gateway is reachable and within subnet only if the route is new
            if not existing_route and not is_valid_gateway(interface, ip, subnet, via_gateway):
                return jsonify({'status': 'error', 'message': f'Invalid or unreachable gateway for route {to_network}.'}), 400

        netplan_config_path = f'/etc/netplan/{interface}.yaml'

        # Read existing netplan config
        try:
            with open(netplan_config_path, 'r') as f:
                config = yaml.safe_load(f) or {}
        except FileNotFoundError:
            config = {}

        config.setdefault('network', {}).setdefault('version', 2)
        ethernets = config['network'].setdefault('ethernets', {})
        interface_config = ethernets.setdefault(interface, {})

        if dhcp_enabled:
            interface_config['dhcp4'] = True
            interface_config['dhcp6'] = True
            interface_config.pop('addresses', None)
            interface_config.pop('nameservers', None)
            interface_config.pop('routes', None)
        else:
            if '/' in subnet:
                cidr = subnet.split('/')[1]
            elif subnet.count('.') == 3:
                cidr = subnet_to_cidr(subnet)
            elif subnet.isdigit() and 0 <= int(subnet) <= 32:
                cidr = subnet
            else:
                return jsonify({'status': 'error', 'message': 'Invalid subnet format.'}), 400
            
            interface_config['dhcp4'] = False
            interface_config['dhcp6'] = False
            interface_config['addresses'] = [f"{ip}/{cidr}"]
            # Handle DNS deletion
            if dns_servers:
                interface_config['nameservers'] = {'addresses': dns_servers}
            else:
                interface_config.pop('nameservers', None)  # Remove DNS entry if empty

            # Extract existing routes
            existing_routes = interface_config.get('routes', [])
            static_routes = [route for route in existing_routes if route.get('to') != 'default']
            default_routes = [route for route in existing_routes if route.get('to') == 'default']

            # Remove specific static routes
            if routes_to_remove:
                static_routes = [
                    route for route in static_routes
                    if route['to'] not in [r['to'] for r in routes_to_remove] or route['via'] not in [r['via'] for r in routes_to_remove]
                ]

            # Remove all static routes if requested
            if remove_static:
                static_routes = []

            # Remove the default route if requested
            if remove_default:
                default_routes = []

            # Update static routes (overwrite if exists, else add new)
            updated_static_routes = []
            for route in routes:
                if 'to' in route and 'via' in route and is_valid_ip(route['via']):
                    # Prevent static routes from being converted to default routes
                    if route['to'] == 'default':
                        continue  # Skip default routes here (handled separately)

                    existing_route = next((r for r in static_routes if r['to'] == route['to']), None)
                    route_metric = int(route.get('metric', default_metric))  # Ensure default metric is applied
                    if existing_route:
                        existing_route['via'] = route['via']  # Overwrite existing static route
                        existing_route['metric'] = route_metric
                    else:
                        updated_static_routes.append({'to': route['to'], 'via': route['via'], 'metric': route_metric})

            # Merge static routes
            static_routes = updated_static_routes + static_routes  # Keep old ones unless updated

            # Handle default route separately
            if gateway and any(route.get("to") == "default" for route in routes):
                default_routes = [{'to': 'default', 'via': gateway, 'metric': default_metric}]

            # Apply the changes
            updated_routes = static_routes + default_routes  # Merge static and default routes
            if updated_routes:
                interface_config['routes'] = updated_routes
            else:
                interface_config.pop('routes', None)

        # Save changes directly to netplan config
        with open(netplan_config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        # Apply Netplan changes and handle errors
        generate_output = run_command(['sudo', 'netplan', 'generate'])
        if "error" in generate_output.lower():
            return jsonify({'status': 'error', 'message': f'Netplan generate failed: {generate_output}'}), 500

        apply_output = run_command(['sudo', 'netplan', 'apply'])
        if "error" in apply_output.lower():
            return jsonify({'status': 'error', 'message': f'Netplan apply failed: {apply_output}'}), 500

        link_up_output = run_command(['sudo', 'ip', 'link', 'set', interface, 'up'])
        if "No such process" in link_up_output:
            return jsonify({'status': 'error', 'message': 'No such process. Interface may not exist.'}), 400

        return jsonify({'status': 'success', 'message': 'Network configuration updated successfully.'})

    except PermissionError:
        return jsonify({'status': 'error', 'message': 'Permission denied. Run as root.'}), 403
    except FileNotFoundError:
        return jsonify({'status': 'error', 'message': 'Netplan configuration file not found.'}), 404
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

        # Define the marker file to check if setup was already done
        marker_file = "/etc/netplan/setup_done.marker"
        if os.path.exists(marker_file):
            print("Network setup has already been performed. Skipping configuration.")
            return

        # Define Netplan directory
        netplan_dir = "/etc/netplan"

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

        # Define interface configurations (interface-specific files)
        interfaces = {
            "enp1s0": {
                "addresses": ["192.168.4.1/24"],
                "dhcp4": False,
                "dhcp6": False
            },
            "enp2s0": {
                "dhcp4": True,
                "dhcp6": True
            },
            "enp3s0": {
                "dhcp4": True,
                "dhcp6": True
            },
            "enp4s0": {
                "dhcp4": True,
                "dhcp6": True
            },
            "enp6s0f0": {
                "addresses": ["10.1.1.1/30"],
                "dhcp4": False,
                "dhcp6": False,
                "routes": [{"to": "255.255.255.255/32", "via": "10.1.1.1", "metric": 100}]
            }
        }

        # Create separate Netplan configuration files for each interface
        for interface, settings in interfaces.items():
            netplan_config_path = os.path.join(netplan_dir, f"{interface}.yaml")

            netplan_config = {
                "network": {
                    "version": 2,
                    "ethernets": {
                        interface: settings
                    }
                }
            }

            # Write configuration to file
            with open(netplan_config_path, "w") as f:
                yaml.dump(netplan_config, f)
            
            print(f"Created Netplan configuration for {interface}: {netplan_config_path}")

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
        '-w', '1',          # Number of worker processes
        '-b', '0.0.0.0:5051', # Bind to 0.0.0.0:5001
        app_module           # Pass the module name dynamically
    ])
