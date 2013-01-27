## @namespace example_server::rest
#  Really simple read-only REST API for accessing a fixed list of authors and books.
#  Supports only HTTP GET. All responses are encoded in JSON.
#  <p>Source at https://bitbucket.org/MasonM/apeye/src/tip/examples/api.apeye.org/example_server/rest.py</p>
#  <p>Doxygen config at https://bitbucket.org/MasonM/apeye/src/tip/examples/doxygen/</p>
from flask import json, Response
from example_server import app

authors = (
	{ "id": 1, "name": u"Bernardo Soares" },
	{ "id": 2, "name": u"Alberto Caeiro" },
	{ "id": 3, "name": u"\xc1lvaro de Campos" },
	{ "id": 4, "name": u"Alexander Search" },
	{ "id": 5, "name": u"Ricardo Reis" },
	{ "id": 6, "name": u"Fernando Pessoa" },
)

books = (
	{ "id": 1, "name": u"The Book of Disquiet", "author_id": 1 },
	{ "id": 2, "name": u"Collected Poems of \xc1lvaro de Campos", "author_id": 3 },
	{ "id": 3, "name": u"The Collected Poems of Alberto Caeiro", "author_id": 2 },
	{ "id": 4, "name": u"Message", "author_id": 6 },
)

@app.route("/rest/author/", methods=["GET"])
## Returns list of all authors
#  @apeye{url=api.apeye.org/rest/author}
def list_authors():
	return Response(json.dumps(authors), mimetype="application/json")

@app.route("/rest/author/<author_id>", methods=["GET"])
## Returns the author corresponding to the given ID
#  @apeye{url=api.apeye.org/rest/author/3}
def get_author(author_id):
	try: 
		return Response(json.dumps(authors[int(author_id) - 1]), mimetype="application/json")
	except IndexError:
		return ""

@app.route("/rest/book/", methods=["GET"])
## Returns list of all books
#  @apeye{url=api.apeye.org/rest/book}
def list_books():
	return Response(json.dumps(books), mimetype="application/json")

@app.route("/rest/book/<book_id>", methods=["GET"])
## Returns the book corresponding to the given ID
#  @apeye{url=api.apeye.org/rest/book/3}
def get_book(book_id):
	try: 
		return Response(json.dumps(books[int(book_id) - 1]), mimetype="application/json")
	except IndexError:
		return ""
