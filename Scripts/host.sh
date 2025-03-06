#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/host.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/bin/Chiefnet-OT-Shield/PythonScript/host.py
WorkingDirectory=/usr/bin/Chiefnet-OT-Shield/PythonScript
User=$USERNAME
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable host.service
sudo systemctl start host.service
sudo systemctl restart host.service
