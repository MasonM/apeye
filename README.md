Overview
========

APEye is a jQuery widget for issuing HTTP requests, designed to help document and test APIs. With a few lines of Javascript, you can let users experiment with your API without leaving the documentation. Unlike [hurl](http://hurl.it/) and [apigee](http://apigee.com), requests are handled entirely by the client -- no server-side proxy is needed.

Homepage: [http://www.apeye.org/](http://www.apeye.org/)

Features
========

* Tested in Firefox 17+, Chrome 20+, and IE 8-9
* Supports SOAP 1.1, SOAP 1.2, XML-RPC, and JSON-RPC 2.0
* Powered by [CodeMirror](http://codemirror.com), with automatic syntax highlighing and pretty-printing
* Circumvents the [same-origin policy](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) for subdomains
* Can generate permanent links to snapshot a request and response
* Autocompletion support for method names and URLs
