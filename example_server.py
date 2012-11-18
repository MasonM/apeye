"""
A Flask app that exposes a common set of math functions via JSON-RPC 2.0,
XML-RPC and SOAP 1.1 using the simplejsonrpc, Flask-XML-RPC, and soaplib
libraries, respectively.

Also implements a very simple pastebin that can be used for exploRPC's permanent
link functionality by storing the serialized requests and responses.
"""
import simplejsonrpc, soaplib, MySQLdb, math, hashlib
from flask import Flask, request, make_response
from flaskext.xmlrpc import XMLRPCHandler
from werkzeug.wsgi import DispatcherMiddleware
from soaplib.core.service import rpc, DefinitionBase
from soaplib.core.model.clazz import Array
from soaplib.core.model.primitive import Decimal
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
	hdr = 'Access-Control-Allow-%s'
	response.headers[hdr % 'Origin'] = '*'
	response.headers[hdr % 'Headers'] = "Content-Type, Authentication"
	response.headers[hdr % 'Method'] = "POST, GET, OPTIONS, PUT, DELETE, TRACE"
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

@app.route("/pastebin", methods=["GET", "POST"])
def pastebin():
	db = MySQLdb.connect(host='localhost', user='explorpc', db='example_server')
	result = ''
	if request.method == "POST" and request.headers['CONTENT_LENGTH']:
		result = insert_entry(db.cursor(), request.data)
		db.commit()
	elif request.method == "GET":
		print request.args['id']
		result = get_entry(db.cursor(), request.args['id'])
	return make_response(unicode(result), 200)
def get_entry(cursor, entry_id):
	cursor.execute("SELECT entry FROM entries WHERE id = %s", (entry_id,))
	row = cursor.fetchone()
	return row[0] if row else ""
def insert_entry(cursor, entry):
	content_hash = hashlib.sha1(entry).hexdigest()
	if not get_entry(cursor, content_hash):
		cursor.execute("INSERT INTO entries (id, entry, created_time) VALUES (%s, %s, NOW())", (content_hash, entry));
	return content_hash

@app.route("/")
def index(): return open('index.html').read()

@app.route("/tunnel.html")
def tunnel(): return open('tunnel.html').read()

if __name__ == "__main__":
	app.debug = True
	app.run(port=80)
