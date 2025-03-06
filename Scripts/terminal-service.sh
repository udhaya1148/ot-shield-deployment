#!/bin/bash

USERNAME=$(whoami)
SERVICE_FILE="/etc/systemd/system/terminal.service"
VIRTUAL_ENV_PATH="/usr/bin/Chiefnet-OT-Shield/PythonScript/myenv"  # Path to your virtual environment
PYTHON_SCRIPT_PATH="/usr/bin/Chiefnet-OT-Shield/PythonScript/terminal.py"  # Path to your Python script
WORKING_DIR="/usr/bin/Chiefnet-OT-Shield/PythonScript"

# Create the virtual environment if it does not exist
if [ ! -d "$VIRTUAL_ENV_PATH" ]; then
    echo "Creating virtual environment..."
    cd $WORKING_DIR || exit 1
    python3 -m venv myenv
fi

# Fix permissions for the virtual environment
echo "Setting ownership of the virtual environment directory..."
sudo chown -R $(whoami):$(whoami) $VIRTUAL_ENV_PATH

cat <<EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Flask Application with Auto-reload on Changes
After=network.target

[Service]
ExecStart=/bin/bash -c "source $VIRTUAL_ENV_PATH/bin/activate && gunicorn -w 1 -k eventlet -b 0.0.0.0:5054 terminal:app"
Restart=always
User=$USERNAME
WorkingDirectory=$WORKING_DIR
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
pip install --upgrade pip
pip install flask flask-socketio gunicorn eventlet paramiko
pip install python-pam

# Reload systemd and start the service
echo "Reloading systemd and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable terminal.service
sudo systemctl start terminal.service
netcon@netcon:/usr/bin/Chiefnet-OT-Shield/S
