from flask import Flask, request, jsonify
import os
import subprocess
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
     
def get_current_hostname():
    try:
        result = subprocess.run(['hostname'], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def update_hostname(new_hostname):
    try:
        # Update /etc/hostname
        with open("/etc/hostname", "w") as hostname_file:
            hostname_file.write(new_hostname + "\n")
        
        # Update /etc/hosts
        with open("/etc/hosts", "r") as hosts_file:
            hosts_lines = hosts_file.readlines()
        
        with open("/etc/hosts", "w") as hosts_file:
            for line in hosts_lines:
                if "127.0.1.1" in line:
                    hosts_file.write(f"127.0.1.1   {new_hostname}\n")
                else:
                    hosts_file.write(line)
        
        # Apply the hostname change
        subprocess.run(['hostnamectl', 'set-hostname', new_hostname], check=True)
        return True, "Hostname updated successfully"
    except Exception as e:
        return False, str(e)
    
def parse_hosts_file():
    hosts = []
    try:
        with open("/etc/hosts", "r") as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith("#"):  # Ignore comments
                    parts = line.split()
                    if len(parts) >= 2:
                        ip = parts[0]
                        hostnames = " , ".join(parts[1:])
                        hosts.append({"ip": ip, "enabled": True, "hostnames": hostnames})
    except Exception as e:
        print(f"Error reading hosts file: {e}")
    return hosts

HOSTS_FILE = "/etc/hosts"  # Path to the hosts file

# Function to read hosts from /etc/hosts
def read_hosts():
    hosts = []
    try:
        with open(HOSTS_FILE, "r") as file:
            for line in file:
                parts = line.strip().split()
                if len(parts) >= 2:
                    ip = parts[0]
                    hostnames = " ".join(parts[1:])
                    hosts.append({"ip": ip, "enabled": True, "hostnames": hostnames})
    except Exception as e:
        print("Error reading hosts file:", e)
    return hosts

# Function to write hosts to /etc/hosts
def write_hosts(hosts):
    try:
        with open(HOSTS_FILE, "w") as file:
            for host in hosts:
                file.write(f"{host['ip']} {host['hostnames']}\n")
    except Exception as e:
        print("Error writing to hosts file:", e)


# API to add a new host
@app.route("/hosts", methods=["POST"])
def add_host():
    data = request.json
    if "ip" in data and "hostnames" in data:
        hosts = read_hosts()
        hosts.append({"ip": data["ip"], "enabled": True, "hostnames": data["hostnames"]})
        write_hosts(hosts)
        return jsonify({"message": "Host added successfully"}), 201
    return jsonify({"error": "Invalid data"}), 400

# API to delete a host
@app.route("/hosts/<ip>", methods=["DELETE"])
def delete_host(ip):
    hosts = read_hosts()
    updated_hosts = [host for host in hosts if host["ip"] != ip]
    
    if len(updated_hosts) == len(hosts):
        return jsonify({"error": "Host not found"}), 404
    
    write_hosts(updated_hosts)
    return jsonify({"message": "Host deleted successfully"}), 200

@app.route("/hosts", methods=["GET"])
def get_hosts():
    return jsonify(parse_hosts_file())

@app.route('/hostname', methods=['GET'])
def fetch_hostname():
    hostname = get_current_hostname()
    if hostname:
        return jsonify({"hostname": hostname})
    else:
        return jsonify({"error": "Failed to fetch hostname"}), 500

@app.route('/update-hostname', methods=['POST'])
def change_hostname():
    data = request.json
    new_hostname = data.get("hostname")
    
    if not new_hostname:
        return jsonify({"status": "error", "message": "Hostname cannot be empty"}), 400
    
    success, message = update_hostname(new_hostname)
    if success:
        return jsonify({"status": "success", "message": message})
    else:
        return jsonify({"status": "error", "message": message}), 500

if __name__ == "__main__":

    script_filename = os.path.basename(__file__).replace('.py', '')
    app_module = f"{script_filename}:app"

    subprocess.run([
        'gunicorn',
        '-w', '1',          # Number of worker processes
        '-b', '0.0.0.0:5056', # Bind to 0.0.0.0:5056
        app_module           # Pass the module name dynamically
    ])
