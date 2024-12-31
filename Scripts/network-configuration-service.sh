#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/network-configuration.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/bin/Chiefnet-OT-Shield/PythonScript/Network-configuration.py
Restart=always
User=$USERNAME
WorkingDirectory=/usr/bin/Chiefnet-OT-Shield/PythonScript
Environment=PYTHONUNBUFFERED=1
Environment=PATH=/usr/bin:/usr/local/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable network-configuration.service
sudo systemctl start network-configuration.service
sudo systemctl restart network-configuration.service
