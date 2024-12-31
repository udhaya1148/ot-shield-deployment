from flask import Flask, jsonify
import subprocess
import json
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
@app.route('/get-routes', methods=['GET'])
def get_routes():
    # Run the "route -n" command and capture the output
    result = subprocess.run(['/sbin/route', '-n'], stdout=subprocess.PIPE)

    # Decode the output to a string
    output = result.stdout.decode('utf-8')

    # Split the output into lines
    lines = output.splitlines()

    # Extract the headers and routes
    headers = lines[1].split()
    routes = [line.split() for line in lines[2:]]

    # Convert the routes to a list of dictionaries
    routes_dict = [dict(zip(headers, route)) for route in routes]

    # Return the data as a JSON response
    return jsonify(routes_dict)

if __name__ == "__main__":

    script_filename = os.path.basename(__file__).replace('.py', '')
    app_module = f"{script_filename}:app"

    subprocess.run([
        'gunicorn',
        '-w', '4',          # Number of worker processes
        '-b', '0.0.0.0:5003', # Bind to 0.0.0.0:5005
        app_module           # Pass the module name dynamically
    ])
