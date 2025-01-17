import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to save the static ARP script
ARP_FILE_PATH = '/etc/networkd-dispatcher/routable.d/setarp-static'

# Get ARP table data
def get_arp_data():
    try:
        result = subprocess.run(['arp', '-e'], capture_output=True, text=True, check=True)
        arp_output = result.stdout
        arp_entries = []
        lines = arp_output.splitlines()

        for line in lines[1:]:
            columns = line.split()
            if len(columns) >= 5:
                ip = columns[0]
                hw_type = columns[1]
                mac = columns[2]
                flags = columns[3]
                iface = columns[4]

                arp_entries.append({
                    'ip': ip,
                    'hw_type': hw_type,
                    'mac': mac,
                    'flags': flags,
                    'iface': iface
                })

        return arp_entries

    except Exception as e:
        return {'error': str(e)}

# Get network interfaces
def get_interfaces():
    try:
        result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True, check=True)
        interfaces_output = result.stdout
        interfaces = []
        
        for line in interfaces_output.splitlines():
            if 'state' in line:
                iface = line.split(':')[1].strip().split('@')[0]
                interfaces.append(iface)

        return interfaces

    except Exception as e:
        return {'error': str(e)}

# Add static ARP entry
def add_static_arp(ip, mac):
    try:
        # Fetch the list of IP addresses assigned to all network interfaces
        result =subprocess.run(['ip','-4','addr','show'],capture_output=True, text=True, check=True)
        interface_data = result.stdout
        interface_ips =[]

        for line in interface_data.splitlines():
            line = line.strip()
            if line.startswith("inet"):
                parts = line.split()
                interface_ip = parts[1].split('/')[0]  #Extract ip address
                interface_ips.append(interface_ip)

        # check if the ARP IP matches any interface IP
        if ip in interface_ips:
            return{"error": f"The IP address {ip} is already assigned to a network interface."}
        
        # Check if the IP already exists in the ARP table
        arp_data = get_arp_data()
        if isinstance(arp_data, list):
            for entry in arp_data:
                if entry['ip'] == ip:
                    return {"error": f"IP address {ip} is already present in the ARP table."}
        
        # Ensure the ARP script starts with the shebang
        arp_entry = f"arp -s {ip} {mac}\n"
        
        if not os.path.exists(ARP_FILE_PATH):
            # Create a new script with a proper header
            with open(ARP_FILE_PATH, 'w') as file:
                file.write(f"#!/bin/bash\n{arp_entry}")
        else:
            with open(ARP_FILE_PATH, 'r+') as file:
                content = file.read()
                if arp_entry not in content:
                    file.write(arp_entry)

        os.chmod(ARP_FILE_PATH, 0o755)  # Ensure the file is executable
        
        # Execute the script immediately
        subprocess.run(['sudo', 'bash', ARP_FILE_PATH], check=True)

        return {"message": "Static ARP entry added and script executed successfully"}
    except subprocess.CalledProcessError as e:
        return {"error": f"Command execution failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Failed to add ARP entry: {str(e)}"}

# Delete static ARP entry
def delete_static_arp(ip):
    try:
        if not os.path.exists(ARP_FILE_PATH):
            return {"error": "ARP file does not exist."}

        with open(ARP_FILE_PATH, 'r') as file:
            lines = file.readlines()

        # Corrected the condition to ensure both IP and iface match
        updated_lines = [
            line for line in lines 
            if not (line.startswith(f"arp -s {ip} "))
        ]

        if len(lines) == len(updated_lines):
            return {"error": "ARP entry not found."}

        # Rewrite the file with the updated content
        with open(ARP_FILE_PATH, 'w') as file:
            file.writelines(updated_lines)

        # Execute the command to delete the ARP entry from the system
        delete_command = ['sudo', 'arp', '-d', ip]
        subprocess.run(delete_command, check=True)

        # Execute the script immediately to apply changes
        subprocess.run(['bash', ARP_FILE_PATH], check=True)

        return {"message": "Static ARP entry deleted successfully and removed from system"}
    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to execute command: {str(e)}"}
    except Exception as e:
        return {"error": f"Failed to delete ARP entry: {str(e)}"}

# API endpoint to get ARP table
@app.route('/arp', methods=['GET'])
def get_arp_table():
    arp_data = get_arp_data()
    if 'error' in arp_data:
        return jsonify({'error': arp_data['error']}), 500
    return jsonify(arp_data)

# API endpoint to get network interfaces
@app.route('/interfaces', methods=['GET'])
def get_network_interfaces():
    interfaces = get_interfaces()
    if 'error' in interfaces:
        return jsonify({'error': interfaces['error']}), 500
    return jsonify(interfaces)

# API endpoint to add static ARP entry
@app.route('/static', methods=['POST'])
def add_static_arp_entry():
    data = request.get_json()
    ip = data.get('ip')
    mac = data.get('mac')

    if ip and mac:
        result = add_static_arp(ip, mac)
        if 'error' in result:
            return jsonify(result), 500
        return jsonify(result)
    return jsonify({"error": "Missing required data (ip, mac)"}), 400

# API endpoint to delete a static ARP entry
@app.route('/static', methods=['DELETE'])
def delete_static_arp_entry():
    data = request.get_json()
    ip = data.get('ip')

    if ip:
        result = delete_static_arp(ip)
        if 'error' in result:
            return jsonify(result), 500
        return jsonify(result)
    return jsonify({"error": "Missing required data (ip)"}), 400

if __name__ == '__main__':
    # Ensure the ARP file has the shebang and is executable
    if not os.path.exists(ARP_FILE_PATH):
        with open(ARP_FILE_PATH, 'w') as file:
            file.write("#!/bin/bash\n")
    os.chmod(ARP_FILE_PATH, 0o755)

    # Get the current filename dynamically
    current_file = os.path.basename(__file__)  # Get the filename of the current script

    # Run gunicorn programmatically using subprocess
    try:
        subprocess.run(['gunicorn', '-w', '1', '-b', '0.0.0.0:5052', current_file[:-3] + ':app'], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to start gunicorn: {e}")
        sys.exit(1)
