#!/bin/bash

# Dynamically get the username of the current user
USERNAME=$(whoami)

# Define source and destination directories for OT-Shield
SOURCE_DIR="/home/$USERNAME/ot-shield-testing"
DEST_DIR="/usr/bin/ot-shield-testing"

# Function to move a directory
move_directory() {
    if [ "$SOURCE_DIR" != "$DEST_DIR" ]; then
        if [ -d "$1" ]; then
            echo "Moving $1 to $2..."
            sudo mv "$1" "$2"
            if [ $? -eq 0 ]; then
                echo "Directory moved successfully!"
            else
                echo "Failed to move the directory. Please check permissions or paths."
                exit 1
            fi
        else
            echo "Source directory $1 does not exist."
            exit 1
        fi
    else
        echo "Directory is already in the correct location. Skipping move command."
    fi
}

# Move OT-Shield directory to /usr/bin
move_directory "$SOURCE_DIR" "$DEST_DIR"

# Update package lists
sudo apt update

# Install Gunicorn
sudo apt install -y gunicorn || { echo "Failed to install Gunicorn"; exit 1; }

# Install Python dependencies for Flask
sudo apt install -y python3-flask-cors python3-psutil || { echo "Failed to install Flask dependencies"; exit 1; }

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs || { echo "Failed to install Node.js and npm"; exit 1; }

# React app setup
BASE_PATH="$DEST_DIR"
if [ -d "$BASE_PATH" ]; then
    cd "$BASE_PATH" || { echo "Failed to navigate to $BASE_PATH"; exit 1; }

    # Install React and dependencies
    sudo npm install -g npm@latest || { echo "Failed to install npm"; exit 1; }
    npm install react-router-dom || { echo "Failed to install react-router-dom"; exit 1; }
    npm install react-icons --save || { echo "Failed to install react-icons"; exit 1; }

    # Install TailwindCSS
    npm install -D tailwindcss postcss autoprefixer || { echo "Failed to install TailwindCSS"; exit 1; }
    npx tailwindcss init -p || { echo "Failed to initialize TailwindCSS"; exit 1; }
else
    echo "Directory $BASE_PATH not found. Exiting."
    exit 1
fi

# Install Python pip and keyboard module
#sudo apt install -y python3-pip || { echo "Failed to install python3-pip"; exit 1; }
#sudo pip3 install keyboard || { echo "Failed to install Python keyboard module"; exit 1; }

# Install Python pip and virtual environment
sudo apt install -y python3-pip python3-venv || { echo "Failed to install python3-pip and python3-venv"; exit 1; }

# Create a virtual environment for Python packages
VENV_DIR="$BASE_PATH/venv"
python3 -m venv "$VENV_DIR" || { echo "Failed to create virtual environment"; exit 1; }

# Activate the virtual environment
source "$VENV_DIR/bin/activate" || { echo "Failed to activate virtual environment"; exit 1; }

# Install the Python keyboard module in the virtual environment
pip install keyboard || { echo "Failed to install Python keyboard module"; exit 1; }

# Deactivate the virtual environment
deactivate


echo "Setup complete!"
