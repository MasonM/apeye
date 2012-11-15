"""
A simple Flask app that includes a JSON-RPC, XML-RPC and SOAP server that all expose
a set of simple math functions (add, subtract, etc). Useful for testing.
"""
from flask import Flask, request, make_response
from flaskext.xmlrpc import XMLRPCHandler, Fault
from werkzeug.wsgi import DispatcherMiddleware
import simplejsonrpc
import soaplib
import math
from soaplib.core.service import rpc, soap, DefinitionBase
from soaplib.core.model.clazz import Array
from soaplib.core.model.primitive import Integer, Decimal
from soaplib.core.server import wsgi

app = Flask(__name__)

functions = {
	'add': lambda a, b: a + b,
	'subtract': lambda a, b: a - b,
	'multiply': lambda a, b: a * b,
	'divide': lambda a, b: a / b,
	'square': lambda a: a * a,
	'squareRoot': lambda a: math.sqrt(a),
	'sum': lambda a: sum(a),
	'average': lambda a: sum(a) / len(a),
}

xmlrpc_handler = XMLRPCHandler('xml-rpc')
xmlrpc_handler.connect(app, '/xml-rpc')
for name, func in functions.iteritems():
	xmlrpc_handler.register(func, name)

class JSONRPCHandler(simplejsonrpc.JsonrpcHandler):
	def dispatch(self, method_name):
		return functions.get(method_name, None);
@app.route("/json-rpc", methods=['GET', 'POST', 'OPTIONS'])
def jsonrpc():
	result = ''
	if request.headers["CONTENT_LENGTH"]:
		handler = JSONRPCHandler()
		result = handler.handle(request.data)
	response = make_response(result, 200)
	# add CORS headers
	response.headers['Access-Control-Allow-Origin'] = '*'
	response.headers['Access-Control-Allow-Headers'] = "Content-Type, X-Requested-With, Authentication"
	response.headers['Access-Control-Allow-Method'] = "POST, GET, OPTIONS, PUT, DELETE, TRACE"
	return response

class SoapService(DefinitionBase):
	@rpc(Decimal, Decimal, _returns=Decimal)
	def add(self, a, b): return a + b
	@rpc(Decimal, Decimal, _returns=Decimal)
	def subtract(self, a, b): return a - b
	@rpc(Decimal, Decimal, _returns=Decimal)
	def multiply(self, a, b): return a * b
	@rpc(Decimal, Decimal, _returns=Decimal)
	def divide(self, a, b): return a / b
	@rpc(Decimal, _returns=Decimal)
	def square(self, a): return a * a
	@rpc(Decimal, _returns=Decimal)
	def squareRoot(self, a): return math.sqrt(a)
	@rpc(Array(Decimal), _returns=Decimal)
	def sum(self, a): return sum(a)
	@rpc(Array(Decimal), _returns=Decimal)
	def average(self, a): return sum(a) / len(a)
soap_application = soaplib.core.Application([SoapService], 'tns')
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
	'/soap': wsgi.Application(soap_application),
})

if __name__ == "__main__":
	app.debug = True
	app.run(port=80)
