;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		_placeHolders: {
			"json-rpc": {
				"[name=body]": "JSON params array, e.g. [\"Hello JSON-RPC\"]",
				"[name=responseBody]": "JSON result"
			},
			"soap": {
				"[name=method]": "SOAPAction header",
				"[name=body]": "SOAP body, e.g. <m:Search xmlns:m=\"http://google.com\"><term>foobar</term></m:Search>",
				"[name=responseBody]": "SOAP response body"
			},
			"xml-rpc": {
				"[name=body]": "XML payload <params>, e.g. <params><param><value>foo</value></param></params>",
				"[name=responseBody]": "XML response <methodResponse>"
			},
			"raw": {
				"[name=body]": "Request body",
				"[name=responseBody]": "HTTP response body"
			}
		},

		options: {
			type: "json-rpc",
			timeout: 5 * 1000,
		},

		_create: function() {
			this.element
				.resizable({ handles: 'se', })
				.resize($.proxy(this._adjustDimensions, this))
				.delegate('[name=type]', 'change', $.proxy(this._typeChanged, this))
				.delegate('[name=httpMethod]', 'change', $.proxy(this._httpMethodChanged, this))
				.delegate('[name=auth]', 'change', $.proxy(this._authChanged, this))
				.delegate('[name=request]', 'click', $.proxy(this._doRequest, this))
				.delegate('.explorpc-expand', 'click', $.proxy(this.toggleExpand, this))
				.find('button').button();
			this._httpMethodChanged();
			this._authChanged();
			this._typeChanged();
		},

		_adjustDimensions: function() {
			var totalWidth = this.element.width(),
				// subtract 3 pixels for the borders
				sectionWidth = (totalWidth / 2) - 3,
				// sectionWidth - input margins - .field padding
				inputWidth = sectionWidth - 8 - 24,
				authTypeWidth = this.element.find('[name=auth]').outerWidth(true),
				// the auth type select and the inputs should be on the same line
				authInputsWidth = ((inputWidth - authTypeWidth) / 2) - 4,

				type = this.element.find('[name=type]').val(),

				totalHeight = this.element.height(),
				// totalHeight - header height - url field height - type/auth/method field height - button height - field margins
				bodyHeight = totalHeight - 22 - 36 - 60 - 45 - 24,
				responseHeadersHeight = this.element.find('.explorpc-response-headers').outerHeight(),
				// totalHeight - header height - responseHeadersHeight - padding
				responseBodyHeight = totalHeight - 22 - responseHeadersHeight - 24 - 24;

			if (type !== "raw") {
				bodyHeight -= 36; // method field height
				if (type === "json-rpc") bodyHeight -= 33; // notification field height
			}
			this.element
				.find('.explorpc-request, .explorpc-response').height(totalHeight).width(sectionWidth).end()
				.find('.explorpc-body').height(bodyHeight).end()
				.find('[name=url], [name=method], [name=responseHeaders], [name=responseBody], [name=body]').width(inputWidth).end()
				.find('.explorpc-response-body').height(responseBodyHeight).end()
				.find('.explorpc-response-body pre').height(responseBodyHeight - 22).end()
				.find('[name=username], [name=password]').width(authInputsWidth);
		},

		toggleExpand: function(event) {
			this.element
				.css('height', '')
				.css('width', '')
				.toggleClass('explorpc-expanded');
			this._adjustDimensions();
		},

		_typeChanged: function(event) {
			var type = this.element.find('[name=type]').val(),
				httpMethodSelect = this.element.find('[name=httpMethod]');

			this.element
				.removeClass('explorpc-json-rpc explorpc-soap explorpc-raw')
				.addClass('explorpc-' + type);

			if (type === 'json-rpc' || type === 'soap') {
				httpMethodSelect.val('post').attr('disabled', true);
			} else {
				httpMethodSelect.removeAttr('disabled');
			}

			$.each(this._placeHolders[type], $.proxy(function(selector, placeholderString) {
				this.element.find(selector).attr('placeholder', placeholderString);
			}, this));

			this._adjustDimensions();
		}, 

		_httpMethodChanged: function(event) {
			var httpMethod = this.element.find('[name=httpMethod]').val();
			this.element
				.removeClass('explorpc-method-post explorpc-method-get explorpc-method-delete explorpc-method-trace')
				.addClass('explorpc-method-' + httpMethod);
		},

		_authChanged: function(event) {
			var auth = this.element.find('[name=auth]').val();
			this.element.toggleClass('explorpc-auth-basic', auth === 'basic')
		},

		_doRequest: function(event) {
			var params = {};
			params.url = this.element.find('[name=url]').val();
			if (!params.url.match(/^https?:\/\//)) {
				params.url = 'http://' + params.url;
			}
			params.type = this.element.find('[name=httpMethod]').val().toUpperCase();
			params.dataType = 'text';
			params.timeout = this.option('timeout');
			params.processData = false;

			if (this.element.find('[name=auth]').val() === 'basic') {
				params.username = this.element.find('[name=username]').val();
				params.password = this.element.find('[name=password]').val();
			}

			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					params.contentType = 'application/json; charset=utf-8';
					params.data = this._getJsonRPCRequestBody();
					break;
				case 'soap':
					params.contentType = 'text/xml; charset=utf-8';
					params.headers = { "SOAPAction": this.element.find('[name=method]').val() };
					params.data = this._getSoapRequestBody();
					break;
			}

			var req = $.ajax(params)
				.fail($.proxy(this._requestError, this))
				.done($.proxy(this._requestDone, this));
		},

		_getJsonRPCRequestBody: function() {
			var method = this.element.find('[name=method]').val(),
				params = this.element.find('[name=body]').val(),
				request = '';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (this.element.find('[name=notification]:checked').length) request += ',"id": 1';
			return request += '}';
		},

		_getSoapRequestBody: function() {
			var body = this.element.find('[name=body]').val(), request = '';
			request = '<?xml version="1.0" encoding="UTF-8"?>\
				<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:enc="http://www.w3.org/2003/05/soap-encoding">\
					<env:Body>' + body + '</env:Body>\
				</env:Envelope>';
			return request;
		},

		_requestError: function(jqXHR) {
			if (jqXHR.status >= 200) {
				return this._requestDone(null, null, jqXHR);
			}
			var errorDesc = "Request failed. Error #" + jqXHR.status + ": " + jqXHR.statusText;
			this.element.find('.explorpc-dialog')
				.text(errorDesc)
				.dialog({
					'height': 'auto',
					'position': { my: "center", at: "center", of: this.element },
					'dialogClass': 'explorpc-dialog'
				});
			this.element
				.find('.explorpc-response-headers pre').text('No response headers').end()
				.find('.explorpc-response-body pre').text('No response body');
		},

		_requestDone: function(data, success, jqXHR) {
			var headers = jqXHR.getAllResponseHeaders(),
				tempDiv = document.createElement('div'),
				statusLine = "HTTP/1.1 " + jqXHR.status + " " + jqXHR.statusText + "\n",
				statusType = this._getTypeFromStatus(jqXHR.status);
			
			statusLine = "<span class=\"explorpc-" + statusType + "\">" + statusLine + "</span>";
			CodeMirror.runMode(headers, "message/http", tempDiv);
			this.element.find('.explorpc-response-headers pre').html(statusLine + tempDiv.innerHTML);
			this.element.find('.explorpc-response-body pre').text(jqXHR.responseText);
		},

		_getTypeFromStatus: function(status) {
			if (status >= 200 && status < 300) {
				return "success";
			} else if (status >= 300 && status < 400) {
				return "redirect";
			} else if (status >= 400 && status < 500) {
				return "client-error";
			} else {
				return "server-error";
			}
		},

		destroy: function () {
			$.Widget.prototype.destroy.call(this);
		}
	});

	$.widget.bridge("explorpc", $.mm.explorpc);
})(jQuery, window, document);
