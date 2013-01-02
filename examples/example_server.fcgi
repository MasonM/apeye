#!/usr/bin/python
from flup.server.fcgi import WSGIServer
from example_server import app

if __name__ == '__main__':
    WSGIServer(app, bindAddress='/tmp/apeye-fcgi.sock').run()
