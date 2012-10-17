CodeMirror.defineMode("httpheaders", function() {
	return {
		token: function(stream, state) {
			var sol = stream.sol() || state.afterSection;
			var eol = stream.eol();

			if (sol) {
				stream.skipTo(":");
				stream.eat(":");
				return "field-name";
			} else {
				stream.skipToEnd();
				return "field-value";
			}
		}
    }
});

CodeMirror.defineMIME("message/http", "httpheaders");
