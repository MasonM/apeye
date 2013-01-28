from example_server import app
application = app

@app.route('/tunnel.html')
def tunnel():
	return file('tunnel.html', 'r').read()

if __name__ == '__main__':
	app.run()
