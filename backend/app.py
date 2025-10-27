from flask import Flask, send_from_directory, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/data/<string:filename>", methods=["GET"])
def get_data(filename):
    if filename == "Rome":
        return send_from_directory("data", "rome-aribnb-data_small_noHostSince.csv")
    elif filename == "Stuttgart":
        return send_from_directory("data", "stuttgart_data.csv")
    else:
        abort(404)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
#to activate:
#source venv/bin/activate
#pip install -r requirements.txt (if needed)
#python app.py
