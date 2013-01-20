module('Autocompletion');

function assertAutocompleteDropdown(field, expectedValues) {
	var actualValues = field.find('.ui-autocomplete .ui-menu-item a').map(function() {
		ok($(this).is(':visible'), this.id + ' visible');
		return $(this).text();
	}).get();
	deepEqual(actualValues, expectedValues);
}

function testAutocomplete(fieldElement, expectedValues) {
	ok(!fieldElement.find('.ui-autocomplete').is(':visible'));
	fieldElement.find('.apeye-combobox-toggle').click();
	ok(fieldElement.find('.ui-autocomplete').is(':visible'));
	assertAutocompleteDropdown(fieldElement, expectedValues);
}

test("method autocompletion w/ array", function() {
	var methods = [ 'foo', 'bar', 'baz' ];
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': 'json-rpc',
		'autocompleteMethodSource': methods
	}); 
	testAutocomplete(apeye.find('.apeye-method'), methods);
});

test("method autocompletion w/ WSDL URL", function() {
	var server = sinon.fakeServer.create(),
		wsdlUrl = 'https://www.example.com/foo?wsdl',
		// not actually a valid WSD, but APEye doesn't care
		wsdlString = '<definitions><portType><operation name="foo"/><operation name="bar"/><operation name="bam"/></portType></definitions>',
		response = [ 200, { "Content-Type": "text/xml" }, wsdlString ];
	server.respondWith("GET", wsdlUrl, response);

	var apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
		'type': 'soap11',
		'autocompleteMethodSource': wsdlUrl
	});
	server.respond();
	testAutocomplete(apeye.find('.apeye-method'), [ 'foo', 'bar', 'bam' ]);
	server.restore();
});

test("url autocompletion w/ array", function() {
	var urls = [ 'http://google.com', 'https://www.example.com/foo' ],
		apeye = $('<div/>').appendTo('#qunit-fixture').apeye({
			'type': 'json-rpc',
			'autocompleteUrlSource': urls
		}); 
	testAutocomplete(apeye.find('.apeye-url'), urls);
});
