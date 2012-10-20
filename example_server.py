"""
A simple Flask app that includes a JSON-RPC and SOAP server that both expose
an "add" method.
"""
from flask import Flask, request, make_response
import simplejsonrpc
from pysimplesoap.server import SoapDispatcher

app = Flask(__name__)

def add_cors_headers(response):
	response.headers['Access-Control-Allow-Origin'] = '*'
	response.headers['Access-Control-Allow-Headers'] = "Content-Type, X-Requested-With, Authentication"
	response.headers['Access-Control-Allow-Method'] = "POST, GET, OPTIONS, PUT, DELETE, TRACE"
	return response

def add(a, b):
	return a + b

class ExploRPCHandler(simplejsonrpc.JsonrpcHandler):
	def dispatch(self, method_name):
		return add if (method_name == "add") else None

@app.route("/jsonrpc",  methods=['GET', 'POST', 'OPTIONS'])
def jsonrpc():
	result = ''
	if request.headers["CONTENT_LENGTH"]:
		h = ExploRPCHandler()
		data = request.data
		result = h.handle(data)
		#app.logger.debug("FOO |%s| |%s|" % (data, result))

	resp = make_response(result, 200)
	return add_cors_headers(resp)


dispatcher = SoapDispatcher(
	'explorpc_dispatcher',
	location = "http://api.explorpc.org/soap",
	action = 'http://api.explorpc.org/', # SOAPAction
	namespace = "http://api.explorpc.org/sample.wsdl", prefix="ns0",
	trace = True,
	ns = True)

# register the user function
dispatcher.register_function('Adder', add,
	returns={'AddResult': int},
	args={'a': int, 'b': int})

@app.route("/soap",  methods=['GET', 'POST', 'OPTIONS'])
def soap():
	result = ''
	if request.headers["CONTENT_LENGTH"]:
		data = request.data
		result = dispatcher.dispatch(data, request.headers["SOAPAction"])
		app.logger.debug("FOO |%s| |%s|" % (data, result))

	resp = make_response(result, 200)
	return add_cors_headers(resp)

@app.route("/")
def index():
	return open('index.html').read()

@app.route("/tunnel.html")
def tunnel():
	return open('tunnel.html').read()

if __name__ == "__main__":
	app.debug = True
	app.run(port=80)
