README.md 
# Network Configuration Utility
This project is a web-based utility built with React.js and Flask to display and update network configuration settings (IP address, subnet mask, gateway, DNS) for interfaces on an Ubuntu server. The backend uses Netplan to handle network configuration changes and psutil to monitor interface status.

# Features
* Display available network interfaces and their current configurations (IP, Subnet, Gateway, DNS).
* Update network settings, including support for both CIDR and subnet masks.
* Automatically apply changes using Netplan and bring interfaces up.
* Avahi integration for hostname resolution via .local.
* Installation & Setup

# Usage
* Access the web UI to view and modify network settings at http://your-server-ip:3000.
* The backend listens on http://your-server-ip:5000 and fetches interface data dynamically.

## Prerequisites after os installation
```
sudo apt update
```
```
sudo apt upgrade
```
```
sudo apt install net-tools 
```

  ## Import project
  ```
 git clone https://github.com/udhaya1148/Chiefnet-OT-Shield.git
  ```
  ## User name : 
  ```
  udhaya1148
  ```
 ## password : 
  ```
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
  ```
  ## Install dependencies
  ```
   cd Chiefnet-OT-Shield  
  ```
  ```
  sudo chmod +x dependencies.sh
  ```
  ```
  ./dependencies.sh
  ```

  ## Setup_Services
  ```
 cd 
```
```
cd /usr/bin/Chiefnet-OT-Shield
```
```
  sudo chmod +x /usr/bin/Chiefnet-OT-Shield/Scripts/*.sh
 ```
  ```
  sudo chmod +x start-service.sh
  ```
```
sudo apt install python3.12-venv
```
  ```
 sudo ./start-service.sh
  ```
## How to Access the UI

Use `<ip>:5050` to open the UI in your browser.

## Press ALT+SHIFT+D to reset default netplan configuration













source myenv/bin/activate
sudo apt install python3-pamela

