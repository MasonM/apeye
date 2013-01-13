var apeye;

function assertVisible(i, val) {
	if (!val) val = i;
	ok(apeye.find(val).is(':visible'), val + ' visible');
}

function assertInvisible(i, val) {
	if (!val) val = i;
	ok(!apeye.find(val).is(':visible'), val + ' invisible');
}

function assertFieldValue(fieldName, fieldValue) {
	deepEqual(apeye.find(fieldName).val(), fieldValue);
}
