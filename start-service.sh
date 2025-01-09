#!/bin/bash

echo "Permissions updated for all scripts."

cd /usr/bin/ot-shield-testing/Scripts/

# Run each script in sequence
echo "Running arp_script.sh..."
sudo ./arp-service.sh

echo "Running network-configuration-service.sh..."
sudo ./network-configuration-service.sh

echo "Running routes-script.sh..."
sudo ./routes-script.sh

echo "Running ui-script.sh..."
sudo ./ui-script.sh

echo "Running default-config-script.sh..."
sudo ./default-config-service.sh

echo "Running terminal.sh..."
sudo ./terminal-service.sh


echo "All scripts executed successfully."

