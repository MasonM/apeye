Overview
========

ExploRPC is a tool for issuing HTTP requests, with many extra features for testing RPC-based APIs. It differs from [hurl](http://hurl.it/) and similar tools in that it's in pure Javascript, relying on a server solely for the permalink feature.

Features
========

* Supports SOAP 1.1, SOAP 1.2, XML-RPC, and JSON-RPC 2.0
* Very compact (usable at sizes as low as 580x300) with several options for resizing
* Easily integrated into Doxygen-generated API documentation
* Can automatically tunnel requests through an iframe to circumvent the [same-origin policy](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) for subdomains
* Supports HTTP Basic authentication
* Request body editor powered by [CodeMirror](http://codemirror.com)
* Pretty-printing of response body
* Can generate permanent links to snapshot a request and response (requires a pastebin-like server)
