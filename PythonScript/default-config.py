import os
import shutil
import subprocess
from pathlib import Path
import keyboard

def handle_key_combination():
    # Paths
    netplan_path = Path("/etc/netplan")
    backup_dir = netplan_path / "backup"
    setup_done_marker = netplan_path / "setup_done.marker"

    # Create backup directory if it doesn't exist
    if not backup_dir.exists():
        backup_dir.mkdir(parents=True, exist_ok=True)
        print(f"Backup directory created at: {backup_dir}")

    # Move all YAML files to the backup directory, overwriting if necessary
    yaml_files = list(netplan_path.glob("*.yaml"))
    if yaml_files:
        for yaml_file in yaml_files:
            backup_file = backup_dir / yaml_file.name
            if backup_file.exists():
                backup_file.unlink()  # Remove the existing file to allow overwrite
                print(f"Deleted existing file: {backup_file}")
            shutil.move(str(yaml_file), str(backup_dir))
            print(f"Moved {yaml_file} to {backup_dir}")
    else:
        print("No YAML files found to move.")

    # Delete setup_done.marker file if it exists
    if setup_done_marker.exists():
        setup_done_marker.unlink()
        print(f"Deleted setup_done.marker at: {setup_done_marker}")
    else:
        print("setup_done.marker file not found.")

    # Restart the service
    try:
        subprocess.run(["sudo", "systemctl", "restart", "network-configuration.service"], check=True)
        print("network-configuration.service restarted successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to restart network-configuration.service: {e}")

# Listen for Alt+Shift+D key combination
keyboard.add_hotkey('alt+shift+d', handle_key_combination)

print("Press Alt+Shift+D to execute the script. Press Ctrl+C to exit.")
try:
    keyboard.wait()  # Keep the program running
except KeyboardInterrupt:
    print("Program terminated.")
