from flask import Flask, request, make_response
import simplejsonrpc as jsonrpc

app = Flask(__name__)

class MyJsonrpcHandler(jsonrpc.JsonrpcHandler):
	"""define your own dispatcher here"""
	def dispatch(self, method_name):
		if method_name == "add":
			return lambda a,b: a+b
		else:
			return default

@app.route("/jsonrpc",  methods=['GET', 'POST', 'OPTIONS'])
def add():
	result = ''
	if request.headers["CONTENT_LENGTH"]:
		h = MyJsonrpcHandler()
		data = request.data
		result = h.handle(data)
		#app.logger.debug("FOO |%s| |%s|" % (data, result))

	resp = make_response(result, 200)
	resp.headers['Access-Control-Allow-Origin'] = '*'
	resp.headers['Access-Control-Allow-Headers'] = "Content-Type, X-Requested-With, Authentication"
	resp.headers['Access-Control-Allow-Method'] = "POST, GET, OPTIONS, PUT, DELETE, TRACE"

	return resp

@app.route("/")
def index():
	return open('index.html').read()

if __name__ == "__main__":
	app.debug = True
	app.run()
