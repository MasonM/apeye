CodeMirror.defineMode("httpmessage", function() {
	return {
		token: function(stream, state) {
			if (state.endOfHeaders) {
				stream.skipToEnd();
				return "body";
			} else if (stream.sol()) {
				var matches = stream.match(/^HTTP\/1.1 (\d+)/);
				if (matches) {
					stream.skipToEnd();
					return "status-" + this._getTypeFromStatus(matches[1]);
				} else {
					stream.skipTo(":");
					stream.eat(":");
					stream.eat(/\s/);
					return "field-name";
				}
			} else {
				stream.skipToEnd();
				return "field-value";
			}
		},

		blankLine: function(state) {
			state.endOfHeaders = true;
		},

		_getTypeFromStatus: function(status) {
			if (status >= 200 && status < 300) {
				return "success";
			} else if (status >= 300 && status < 400) {
				return "redirect";
			} else if (status >= 400 && status < 500) {
				return "client-error";
			} else if (status >= 500 && status < 600) {
				return "server-error";
			} else {
				return "unknown";
			}
		},

		startState: function() {
			return { endOfHeaders: false };
		}
	};
});

CodeMirror.defineMIME("message/http", "httpmessage");
