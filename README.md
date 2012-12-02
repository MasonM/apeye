Overview
========

ExploRPC is a widget for issuing HTTP requests, designed to help document and test RPC-based APIs. Unlike [hurl](http://hurl.it/), it's in pure Javascript, relying on a server solely for the optional permalink feature.

Features
========

* Supports SOAP 1.1, SOAP 1.2, XML-RPC, and JSON-RPC 2.0
* Easily integrated into Doxygen-generated API documentation
* Powered by [CodeMirror](http://codemirror.com), with automatic syntax highlighing and pretty-printing for requests and responses
* Circumvents the [same-origin policy](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) for subdomains by automatically tunneling requests through an iframe
* Can generate permanent links to snapshot a request and response (requires a pastebin-like server)
* Autocompletion support for method names
