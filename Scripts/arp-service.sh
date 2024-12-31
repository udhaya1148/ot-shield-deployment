#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/arp-display.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/bin/ot-shield-testing/PythonScript/arp-pythonscript.py
WorkingDirectory=/usr/bin/ot-shield-testing/PythonScript
User=$USERNAME
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start the service
sudo systemctl daemon-reload
sudo systemctl enable arp-display.service
sudo systemctl start arp-display.service
sudo systemctl restart arp-display.service
