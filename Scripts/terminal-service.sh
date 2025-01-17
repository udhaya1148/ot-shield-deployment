#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/terminal.service"
VIRTUAL_ENV_PATH="/usr/bin/Chiefnet-OT-Shield/PythonScript/myenv"  # Path to your virtual environment
PYTHON_SCRIPT_PATH="/usr/bin/Chiefnet-OT-Shield/PythonScript/terminal.py"  # Path to your Python script

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/bin/bash -c "source $VIRTUAL_ENV_PATH/bin/activate && gunicorn -w 1 -k eventlet -b 0.0.0.0:5054 terminal:app"
Restart=always
User=$USERNAME
WorkingDirectory=/usr/bin/Chiefnet-OT-Shield/PythonScript
Environment=PYTHONUNBUFFERED=1
Environment=PATH=$VIRTUAL_ENV_PATH/bin:/usr/bin:/usr/local/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Install required dependencies in the virtual environment
echo "Activating virtual environment and installing dependencies..."
source "$VIRTUAL_ENV_PATH/bin/activate"
pip install flask flask-socketio gunicorn eventlet

# Reload systemd and start the service
echo "Reloading systemd and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable terminal.service
sudo systemctl start terminal.service
