from flask import Flask, request
from flask_socketio import SocketIO, emit
import paramiko
import threading
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# SSH Configuration
SSH_HOST = '172.18.1.208'
SSH_PORT = 22
SSH_USERNAME = 'netcon'
SSH_PASSWORD = 'netcon'

# Dictionary to store SSH session information
ssh_connect = {}

# Function to handle SSH connection
def ssh_connect_handler(sid):
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(
            SSH_HOST,
            port=SSH_PORT,
            username=SSH_USERNAME,
            password=SSH_PASSWORD,
            timeout=10
        )
        
        # Open an interactive shell session
        channel = ssh_client.invoke_shell()
        ssh_connect[sid] = channel
        print(f"SSH session established for {sid}")

        # Continuously read and send data from the SSH channel to the client
        while True:
            if channel.recv_ready():
                output = ""
                while channel.recv_ready():
                    output += channel.recv(1024).decode()
                socketio.emit('terminal_output', {'output': output}, room=sid)

    except Exception as e:
        socketio.emit('error', {'message': str(e)}, room=sid)
        print(f"Error for {sid}: {str(e)}")

    finally:
        if sid in ssh_connect:
            ssh_connect[sid].close()
            del ssh_connect[sid]
        print(f"SSH connection for {sid} closed.")

# Handle WebSocket connection
@socketio.on('connect')
def handle_connect():
    sid = request.sid
    print(f"Client connected: {sid}")
    threading.Thread(target=ssh_connect_handler, args=(sid,)).start()

# Handle terminal input from the client
@socketio.on('terminal_input')
def handle_terminal_input(data):
    sid = request.sid
    command = data.get('command', '')

    if not command.strip():
        print(f"User {sid} pressed Enter with no command.")
        return

    if sid in ssh_connect:
        channel = ssh_connect[sid]
        if channel:
            try:
                channel.send(command + '\n')
                print(f"Command sent from {sid}: {command}")
            except Exception as e:
                print(f"Error sending command for {sid}: {str(e)}")
                socketio.emit('error', {'message': str(e)}, room=sid)
        else:
            print(f"No active SSH channel for {sid}.")
            socketio.emit('error', {'message': 'No active SSH channel'}, room=sid)

# Handle WebSocket disconnection
@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in ssh_connect:
        ssh_connect[sid].close()
        del ssh_connect[sid]
    print(f"Client {sid} disconnected and cleaned up.")

# Start the Flask app with SocketIO
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5004)
