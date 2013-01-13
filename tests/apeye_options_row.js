module('Options row');

function checkRawTypeChange() {
	apeye.find('[name=type]').val('raw').trigger('change');
	$.each(['[name=id]', '[name=method]'], assertInvisible);
	assertVisible('[name=url]');
	strictEqual(apeye.find('.apeye-request-body-header').text(), 'Request Body');
}

test("selecting JSON-RPC for \"Type\" drop-down", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=type]').val('json-rpc').trigger('change');
	$.each(['[name=id]', '[name=method]', '[name=url]'], assertVisible);
	strictEqual(apeye.find('.apeye-request-body-header').text(), 'JSON Params');
	strictEqual(apeye.find('.apeye-method label').text(), 'Method');

	checkRawTypeChange();
});

test("selecting XML-RPC for \"Type\" drop-down", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=type]').val('xml-rpc').trigger('change');
	$.each(['[name=method]', '[name=url]'], assertVisible);
	assertInvisible('[name=id]');
	strictEqual(apeye.find('.apeye-request-body-header').text(), 'XML <params>');
	strictEqual(apeye.find('.apeye-method label').text(), 'Method');

	checkRawTypeChange();
});

function soapCheck(soapType) {
	return function() {
		apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
		apeye.find('[name=type]').val(soapType).trigger('change');
		$.each(['[name=method]', '[name=url]'], assertVisible);
		assertInvisible('[name=id]');
		strictEqual(apeye.find('.apeye-request-body-header').text(), 'SOAP Body');
		strictEqual(apeye.find('.apeye-method label').text(), 'SOAPAction');

		checkRawTypeChange();
	};
}
test("selecting SOAP 1.1 for \"Type\" drop-down", soapCheck('soap11'));
test("selecting SOAP 1.2 for \"Type\" drop-down", soapCheck('soap12'));

function noBodyCheck(httpMethod) {
	return function() {
		apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
		apeye.find('[name=httpMethod]').val(httpMethod).trigger('change');
		$.each(['[name=method]', '[name=id]', '.apeye-body'], assertInvisible);
		assertVisible(apeye.find('[name=url]'));
	};
}
test("selecting GET for \"HTTP Method\" drop-down", noBodyCheck('get'));
test("selecting DELETE for \"HTTP Method\" drop-down", noBodyCheck('delete'));
test("selecting TRACE for \"HTTP Method\" drop-down", noBodyCheck('trace'));
test("selecting PUT for \"HTTP Method\" drop-down", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=httpMethod]').val('put').trigger('change');
	$.each(['[name=method]', '[name=id]'], assertInvisible);
	$.each(['[name=url]', '.apeye-body'], assertVisible);
});

test("selecting Basic for \"Auth\" drop-down", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=auth]').val('basic').trigger('change');
	$.each(['[name=username]', '[name=password]'], assertVisible);

	apeye.find('[name=auth]').val('none').trigger('change');
	$.each(['[name=username]', '[name=password]'], assertInvisible);
});
