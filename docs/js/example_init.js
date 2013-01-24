// Must define document.domain so we can tunnel requests to api.apeye.org
document.domain = "apeye.org";

$(function() {
	$('#apeye-demo').apeye({
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
		// Function to handle sending/retrieving serialized state strings, used for the "Permanent Link" functionality
		'permalinkHandler': function(sending, dataOrId, successCallback) {
			// Use a simple Flask-based pastebin (source at examples/api.apeye.org/example_server/pastebin.py) to
			// store the serialized data. The pastebin has the following API:
			// * To store data, POST it to /pastebin. The response will contain an ID.
			// * To retrieve data, do a GET on /pastebin?id=<id>, with <id> replaced with the desired ID
			var endpoint = "http://api.apeye.org/pastebin";
			this.tunnelRequest(endpoint, function(ajax) {
				ajax({
					url: endpoint,
					type: sending ? "POST" : "GET",
					contentType: "text/plain", // tells jQuery to not try to decode response. We want it raw
					data: sending ? dataOrId : { id : dataOrId }
				}).done(function(data) {
					if (sending) {
						// The "$(window).on('hashchange')" logic below will take care of kicking of the unserialization,
						// since it calls setFieldsFromString with the hash string, which will set the permalinkId
						var link = 'http://apeye.org/#permalinkId=' + data;
						successCallback(link, link);
					} else {
						successCallback(data);
					}
				});
			});
		}
	});

	$(window).on('hashchange', function() {
		// If window hash changes, this updates options and/or fields encoded in the hash string
		$('#apeye-demo').apeye('setFieldsFromString', window.location.hash.substring(1));
	}).trigger('hashchange');
});
