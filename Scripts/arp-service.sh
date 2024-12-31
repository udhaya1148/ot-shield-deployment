#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/arp.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/bin/Chiefnet-OT-Shield/PythonScript/arp-pythonscript.py
WorkingDirectory=/usr/bin/Chiefnet-OT-Shield/PythonScript
User=$USERNAME
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable arp.service
sudo systemctl start arp.service
sudo systemctl restart arp.service
