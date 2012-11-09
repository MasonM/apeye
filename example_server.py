"""
A simple Flask app that includes a JSON-RPC, XML-RPC and SOAP server that all expose
an "add" method.
"""
from flask import Flask, request, make_response
from flaskext.xmlrpc import XMLRPCHandler, Fault
from werkzeug.wsgi import DispatcherMiddleware
import simplejsonrpc
import soaplib
from soaplib.core.service import rpc, soap, DefinitionBase
from soaplib.core.model.primitive import Integer
from soaplib.core.server import wsgi

app = Flask(__name__)

def add_cors_headers(response):
	response.headers['Access-Control-Allow-Origin'] = '*'
	response.headers['Access-Control-Allow-Headers'] = "Content-Type, X-Requested-With, Authentication"
	response.headers['Access-Control-Allow-Method'] = "POST, GET, OPTIONS, PUT, DELETE, TRACE"
	return response


def add(a, b):
	return a + b


xmlrpc_handler = XMLRPCHandler('xml-rpc')
xmlrpc_handler.connect(app, '/xml-rpc')
xmlrpc_handler.register(add)


class ExploRPCHandler(simplejsonrpc.JsonrpcHandler):
	def dispatch(self, method_name):
		return add if (method_name == "add") else None
@app.route("/json-rpc", methods=['GET', 'POST', 'OPTIONS'])
def jsonrpc():
	result = ''
	if request.headers["CONTENT_LENGTH"]:
		h = ExploRPCHandler()
		data = request.data
		result = h.handle(data)
		#app.logger.debug("FOO |%s| |%s|" % (data, result))
	resp = make_response(result, 200)
	return add_cors_headers(resp)


class AddService(DefinitionBase):
	@rpc(Integer,Integer,_returns=Integer)
	def add(self,a,b):
		 return a + b
soap_application = soaplib.core.Application([AddService], 'tns')
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
	'/soap': wsgi.Application(soap_application),
})


@app.route("/")
def index():
	return open('index.html').read()


@app.route("/tunnel.html")
def tunnel():
	return open('tunnel.html').read()


if __name__ == "__main__":
	app.debug = True
	app.run(port=80)
