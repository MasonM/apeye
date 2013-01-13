var xhr, requests;

module('XHR Request', {
	setup: function() {
		xhr = sinon.useFakeXMLHttpRequest();
		requests = [];
		xhr.onCreate = function (req) {
			requests.push(req);
		};
	},
	teardown: function() {
		xhr.restore();
	}
});

test("raw request", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': 'raw',
		'body': 'foobar',
		'url': 'http://example.com'
	});
	apeye.find('[name=request]').click();
	strictEqual(requests.length, 1);
	requests[0].respond(200, { "Content-Type": "text/plain" }, 'foo');

	var expectedParams = {
		'url': 'http://example.com',
		'method': 'POST',
		'async': true,
		'requestBody': 'foobar'
	};
	$.each(expectedParams, function (paramName, paramValue) {
		strictEqual(requests[0][paramName], paramValue);
	});
	strictEqual(apeye.find('.apeye-response .CodeMirror').text().trim(), "HTTP/1.1 200 OKContent-Type: text/plain foo");
});

test("JSON-RPC request", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': 'json-rpc',
		'body': '["foobar"]',
		'method': 'hello',
		'id': 'testid',
		'url': 'http://example.com'
	});
	apeye.find('[name=request]').click();
	strictEqual(requests.length, 1);
	requests[0].respond(200, { "Content-Type": "application/json" }, 'foo');

	var expectedParams = {
		'url': 'http://example.com',
		'method': 'POST',
		'async': true,
		'requestBody': '{"jsonrpc":"2.0","method":"hello","params":["foobar"],"id": "testid"}'
	};
	$.each(expectedParams, function (paramName, paramValue) {
		strictEqual(requests[0][paramName], paramValue);
	});
	strictEqual(apeye.find('.apeye-response .CodeMirror').text().trim(), "HTTP/1.1 200 OKContent-Type: application/json foo");
});

test("XML-RPC request", function() {
	var xmlParams = '<params><param><value>foo</value></param></params>';
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': 'xml-rpc',
		'body': xmlParams,
		'method': 'hello',
		'url': 'http://example.com'
	});
	apeye.find('[name=request]').click();
	strictEqual(requests.length, 1);
	requests[0].respond(200, { "Content-Type": "text/xml" }, 'foo');

	var expectedParams = {
		'url': 'http://example.com',
		'method': 'POST',
		'async': true,
		'requestBody': '<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>hello</methodName>' + xmlParams + '</methodCall>'
	};
	$.each(expectedParams, function (paramName, paramValue) {
		strictEqual(requests[0][paramName], paramValue);
	});
	strictEqual(apeye.find('.apeye-response .CodeMirror').text().trim(), "HTTP/1.1 200 OKContent-Type: text/xml foo");
});

var soapParams = '<m:alert xmlns:m="http://example.org/alert"><m:msg>hello</m:msg></m:alert>';
function testSoapRequest(soapVersion, expectedRequestbody) {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': soapVersion,
		'body': soapParams,
		'method': 'hello',
		'url': 'http://example.com'
	});
	apeye.find('[name=request]').click();
	strictEqual(requests.length, 1);
	requests[0].respond(200, { "Content-Type": "text/xml" }, 'foo');

	var expectedParams = {
		'url': 'http://example.com',
		'method': 'POST',
		'async': true,
		'requestBody': expectedRequestbody
	};
	$.each(expectedParams, function (paramName, paramValue) {
		strictEqual(requests[0][paramName], paramValue);
	});
	strictEqual(requests[0].requestHeaders['SOAPAction'], 'hello');
	strictEqual(apeye.find('.apeye-response .CodeMirror').text().trim(), "HTTP/1.1 200 OKContent-Type: text/xml foo");
}
test("SOAP 1.1 request", function() {
	return testSoapRequest('soap11', '<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><soap:Header/><soap:Body>' + soapParams + '</soap:Body></soap:Envelope>');
});
test("SOAP 1.2 request", function() {
	return testSoapRequest('soap12', '<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Header/><soap:Body>' + soapParams + '</soap:Body></soap:Envelope>');
});
