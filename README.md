Overview
========

APEye is a JQuery widget for issuing HTTP requests, designed to help document and test RPC and REST-based APIs. Unlike [hurl](http://hurl.it/) and [apigee](http://apigee.com), requests are handled entirely by the client -- no server-side proxy is needed.

Features
========

* Supports SOAP 1.1, SOAP 1.2, XML-RPC, and JSON-RPC 2.0
* Easily integrated into Doxygen-generated API documentation
* Powered by [CodeMirror](http://codemirror.com), with automatic syntax highlighing and pretty-printing for requests and responses
* Circumvents the [same-origin policy](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) for subdomains by automatically tunneling requests through an iframe
* Can generate permanent links to snapshot a request and response (requires a pastebin-like server)
* Autocompletion support for method names when provided with a WSDL file
