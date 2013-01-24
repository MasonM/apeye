"""
Really simple read-only REST API for accessing a complete list of my favorite authors
"""
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
def list_authors():
	return Response(json.dumps(authors), mimetype="application/json")

@app.route("/rest/author/<author_id>", methods=["GET"])
def get_author(author_id):
	try: 
		return Response(json.dumps(authors[int(author_id) - 1]), mimetype="application/json")
	except IndexError:
		return ""

@app.route("/rest/book/", methods=["GET"])
def list_books():
	return Response(json.dumps(books), mimetype="application/json")

@app.route("/rest/book/<book_id>", methods=["GET"])
def get_book(book_id):
	try: 
		return Response(json.dumps(books[int(book_id) - 1]), mimetype="application/json")
	except IndexError:
		return ""
