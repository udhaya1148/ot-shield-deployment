from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
import paramiko
import threading
import os
import subprocess

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

ssh_sessions = {}

def ssh_connect_handler(sid, username, password, target_ip, cols=80, rows=24):
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(target_ip, port=22, username=username, password=password, timeout=10)

        channel = ssh_client.invoke_shell(term='xterm', width=cols, height=rows)
        ssh_sessions[sid] = channel

        while channel.recv_ready():
            channel.recv(1024)

        channel.send("clear\n")

        while not channel.closed:
            if channel.recv_ready():
                output = channel.recv(1024).decode("utf-8")
                socketio.emit('terminal_output', {'output': output}, room=sid)
            socketio.sleep(0.01)

        if sid in ssh_sessions:
            socketio.emit('terminal_output', {'output': '\r\nlogout\r\nConnection closed.\r\n'}, room=sid)

    except Exception as e:
        socketio.emit('error', {'message': str(e)}, room=sid)

    finally:
        if sid in ssh_sessions:
            ssh_sessions[sid].close()
            del ssh_sessions[sid]

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    username = request.args.get('username')  # Get username from frontend session
    password = request.args.get('password')  # Get password from frontend session
    target_ip = request.args.get('ip')  # Get IP from frontend session

    if username and password and target_ip:
        threading.Thread(target=ssh_connect_handler, args=(sid, username, password, target_ip)).start()
    else:
        emit('error', {'message': 'Missing credentials or IP address'}, room=sid)

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
        channel = ssh_sessions[sid]
        if channel and not channel.closed:
            channel.close()
        del ssh_sessions[sid]
    print(f"Session {sid} disconnected and cleaned up.")

if __name__ == "__main__":
    script_filename = os.path.basename(__file__).replace('.py', '')
    app_module = f"{script_filename}:app"

    subprocess.run([
        'gunicorn',
        '-w', '1',
        '-k', 'eventlet',
        '-b', '0.0.0.0:5054',
        app_module
    ])
