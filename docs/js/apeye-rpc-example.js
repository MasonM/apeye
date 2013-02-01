// Must define document.domain so we can tunnel requests to api.apeye.org
document.domain = "apeye.org";

$(function() {
	var permalinkEndpoint = "http://api.apeye.org/pastebin";
	var apeyeRpc = $('#apeye-rpc-example').apeye({
		// FIELD SETTERS: Auto-fill the fields with a sample request
		'url': 'api.apeye.org/json-rpc',
		'type': 'json-rpc',
		'method': 'add',
		'body': '[10,20]',
		'httpMethod': 'post',

		// OPTIONS
		// Automatically pretty-print responses
		'autoPrettyPrint': true,
		// Always tunnel requests through an iframe (needed because the endpoint in the sample request is on a different subdomain)
		'subdomainTunneling': true,
		// Available endpoints for the API server app
		'autocompleteUrlSource': [ 'api.apeye.org/json-rpc', 'api.apeye.org/soap', 'api.apeye.org/xml-rpc' ],
		// Get a list of valid methods from the auto-generated WSDL, and use that for autocompletion for the "Method" field
		'autocompleteMethodSource': 'http://api.apeye.org/soap?wsdl',
		// Functions to handle sending/retrieving serialized state strings, used for the "Permanent Link" functionality
		// Uses a simple Flask-based pastebin (source at examples/api.apeye.org/example_server/pastebin.py) to
		// store the serialized data. The pastebin has the following API:
		// * To store data, POST it to /pastebin. The response will contain an ID.
		// * To retrieve data, do a GET on /pastebin?id=<id>, with <id> replaced with the desired ID
		'permalinkSender': function(jsonData, successCallback) {
			this.tunnelRequest(permalinkEndpoint, function(ajax) {
				ajax({
					url: permalinkEndpoint,
					type: "POST",
					contentType: "text/plain",
					data: jsonData
				}).done(function(data) {
					// The "$(window).on('hashchange')" logic below will take care of kicking off the unserialization,
					// since it calls setFieldsFromString with the hash string, which will set the permalinkId
					var link = 'http://apeye.org/#permalinkId=' + data;
					successCallback(link, link);
				});
			});
		},
		'permalinkRetriever': function(permalinkId, successCallback) {
			this.tunnelRequest(permalinkEndpoint, function(ajax) {
				ajax({
					url: permalinkEndpoint,
					type: "GET",
					contentType: "text/plain", // tells jQuery to not try to decode response. We want it raw
					data: { id : permalinkId }
				}).done(function(data) {
					successCallback(data);
				});
			});
		}
	});

	$(window).on('hashchange', function() {
		// If window hash changes, this updates options and/or fields encoded in the hash string
		apeyeRpc.apeye('setFieldsFromString', window.location.hash.substring(1));
	});
	if (window.location.hash.length) {
		apeyeRpc.apeye('setFieldsFromString', window.location.hash.substring(1));
	}
});
