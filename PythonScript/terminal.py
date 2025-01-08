from flask import Flask, request
from flask_socketio import SocketIO, emit
import paramiko
import threading
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

SSH_HOST = '172.18.1.229'
SSH_PORT = 22
SSH_USERNAME = 'netcon'
SSH_PASSWORD = 'netcon'

ssh_sessions = {}

def ssh_connect_handler(sid, cols=80, rows=24):
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
        channel = ssh_client.invoke_shell(term='xterm', width=cols, height=rows)
        ssh_sessions[sid] = channel

        while not channel.closed:
            if channel.recv_ready():
                output = channel.recv(1024).decode("utf-8")
                socketio.emit('terminal_output', {'output': output}, room=sid)
            socketio.sleep(0.01)

    except Exception as e:
        socketio.emit('error', {'message': str(e)}, room=sid)

    finally:
        if sid in ssh_sessions:
            ssh_sessions[sid].close()
            del ssh_sessions[sid]

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    cols, rows = 80, 24  # Default size
    threading.Thread(target=ssh_connect_handler, args=(sid, cols, rows)).start()

@socketio.on('resize')
def handle_resize(data):
    sid = request.sid
    if sid in ssh_sessions:
        channel = ssh_sessions[sid]
        if channel:
            cols = data.get('cols', 80)
            rows = data.get('rows', 24)
            channel.resize_pty(width=cols, height=rows)

@socketio.on('terminal_input')
def handle_terminal_input(data):
    sid = request.sid
    input_data = data.get('data', '')
    if sid in ssh_sessions:
        channel = ssh_sessions[sid]
        if channel:
            channel.send(input_data)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in ssh_sessions:
        ssh_sessions[sid].close()
        del ssh_sessions[sid]

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5004)
