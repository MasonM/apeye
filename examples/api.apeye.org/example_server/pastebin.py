"""
A very simple pastebin that can be used for APEye's permanent
link functionality by storing the serialized requests and responses.
"""
import MySQLdb, hashlib, os, json
from flask import request, make_response
from example_server import app

@app.route("/pastebin", methods=["GET", "POST"])
def pastebin():
	db = MySQLdb.connect(user='apeye', db='pastebin')
	result = ''
	cursor = db.cursor()
	if request.method == "POST" and request.headers['CONTENT_LENGTH']:
		result = insert_entry(cursor, request.data)
		db.commit()
	elif request.method == "GET":
		result = get_entry(cursor, request.args['id'])
	cursor.close()
	db.close()
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
