#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/default-config.service"

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes


[Service]
ExecStart=/usr/bin/python3 /usr/bin/Chiefnet-OT-Shield/PythonScript/default-config.py 
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
sudo systemctl enable default-config.service
sudo systemctl start default-config.service
sudo systemctl restart default-config.service
