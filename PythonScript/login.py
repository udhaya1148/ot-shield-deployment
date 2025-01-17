from flask import Flask, request, jsonify
from flask_cors import CORS
import pamela
import os
import subprocess

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    try:
        pamela.authenticate(username, password)
        return jsonify({"success": True})
    except pamela.PAMError as e:
        return jsonify({"success": False, "message": str(e)}), 401

if __name__ == "__main__":

    script_filename = os.path.basename(__file__).replace('.py', '')
    app_module = f"{script_filename}:app"

    subprocess.run([
        'gunicorn',
        '-w', '1',          # Number of worker processes
        '-b', '0.0.0.0:5055', # Bind to 0.0.0.0:5005
        app_module           # Pass the module name dynamically
    ])
