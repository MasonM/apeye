module('Initialization');

test("element visibility w/ default options", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	var shouldBeVisible = ['select[name=type]', 'select[name=httpMethod]', 'select[name=auth]',
		'input[name=url]', '.apeye-body', '.apeye-response .CodeMirror', 'button[name=request]',
		'button.apeye-viewraw', 'button.apeye-prettyprint', '.apeye-h-expand'];
	$.each(shouldBeVisible, assertVisible);

	var shouldBeInvisible = ['input[name=username]', 'input[name=password]', 'input[name=id]',
		'input[name=method]', 'button.apeye-permalink'];
	$.each(shouldBeInvisible, assertInvisible);
});

test("element values w/ default options", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	var expectedValues = {
		'select[name=type]': 'raw',
		'select[name=httpMethod]': 'post',
		'select[name=auth]': 'none',
		'input[name=url]': '',
		'textarea[name=body]': ''
	};
	$.each(expectedValues, assertFieldValue);
});

test("passed field values are set", function() {
	var fieldValues = {
		'url': 'api.apeye.org/json-rpc',
		'type': 'json-rpc',
		'method': 'add',
		'body': '[10,20]',
		'httpMethod': 'post',
		'id': 'foobar'
	};
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye(fieldValues);
	$.each(fieldValues, function(fieldName, fieldValue) {
		if (fieldName === 'body') {
			strictEqual(apeye.apeye('getFieldValue', 'body'), fieldValue);
		} else assertFieldValue('[name=' + fieldName + ']', fieldValue);
	});
});

test("starting in horizontally expanded mode adjusts height correctly", function() {
	apeye = $('<div/>').addClass('apeye-horizontally-expanded').appendTo('#qunit-fixture').apeye();
	ok(apeye.hasClass('apeye-horizontally-expanded'));
	strictEqual(apeye.height(), 600);
});
