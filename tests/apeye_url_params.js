module('URL Params');

function assertFieldLabels(expectedLabels) {
	var fields = apeye.find('.apeye-url-param-field');
	strictEqual(fields.length, expectedLabels.length);
	$.each(expectedLabels, function(i, labelText) {
		strictEqual(fields.eq(i).text(), labelText);
	});
}

test("on initialization", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye({ url: 'http://example.com/<foo>/<bar>/baz' });
	assertFieldLabels(['foo', 'bar']);

	apeye.find('.apeye-url-param-field input')
		.first().val('foo2').end()
		.last().val('bar2');
	strictEqual(apeye.apeye('getFullUrl'), 'http://example.com/foo2/bar2/baz');
});

test("single param", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=url]').val('http://example.com/<foo>/bar').trigger('change');
	assertFieldLabels(['foo']);

	apeye.find('.apeye-url-param-field input').val('baz');
	strictEqual(apeye.apeye('getFullUrl'), 'http://example.com/baz/bar');
});

test("remove a param", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=url]').val('http://example.com/<foo>/bar').trigger('change');
	assertFieldLabels(['foo']);
	apeye.find('.apeye-url-param-field input').val('baz');

	apeye.find('[name=url]').val('http://example.com/foo/bar').trigger('change');
	strictEqual(apeye.apeye('getFullUrl'), 'http://example.com/foo/bar');
});

test("reorder params", function() {
	apeye = $('<div/>').appendTo('#qunit-fixture').apeye();
	apeye.find('[name=url]').val('http://example.com/<foo>/<bar>').trigger('change');
	assertFieldLabels(['foo', 'bar']);

	apeye.find('[name=url]').val('http://example.com/<bar>/<foo>').trigger('change');
	assertFieldLabels(['bar', 'foo']);

	apeye.find('.apeye-url-param-field input')
		.first().val('bar2').end()
		.last().val('foo2')
	strictEqual(apeye.apeye('getFullUrl'), 'http://example.com/bar2/foo2');
});
