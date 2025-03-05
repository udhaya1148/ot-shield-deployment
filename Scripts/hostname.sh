#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/hostname.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/bin/ot-shield-testing/PythonScript/hostname.py
WorkingDirectory=/usr/bin/ot-shield-testing/PythonScript
User=$USERNAME
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable hostname.service
sudo systemctl start hostname.service
sudo systemctl restart hostname.service
