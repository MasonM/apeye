from flask import Flask
app = Flask(__name__)

import example_server.rpc
import example_server.pastebin

@app.route("/tunnel.html")
def tunnel():
	return open('tunnel.html').read()
