;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		_placeHolders: {
			"json-rpc": {
				"[name=method]": "Method name",
				"[name=body]": "[\"Hello JSON-RPC\"]",
			},
			"soap": {
				"[name=method]": "SOAPAction header",
				"[name=body]": "<m:Search xmlns:m=\"http://google.com\"><term>foobar</term></m:Search>",
			},
			"xml-rpc": {
				"[name=method]": "Method name",
				"[name=body]": "<params><param><value>foo</value></param></params>",
			},
			"raw": {
				"[name=body]": "",
			}
		},

		_bodyEditor: null,

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
				.find('.explorpc-expand').hover(this._expandHover).end()
				.find('button').button();

			this._bodyEditor = CodeMirror.fromTextArea(this.element.find('[name=body]')[0], {
				lineNumbers: false,
				lineWrapping: true,
				matchBrackets: true,
				indentUnit: 3,
				// emulate HTML placeholders
				onBlur: function(editor) {
					if (editor.getValue().length === 0) {
						editor.getWrapperElement().className += ' explorpc-empty';
						editor.setValueToPlaceholder(editor);
					}
				},
				onFocus: function(editor) {
					var wrapper = editor.getWrapperElement();
					if (wrapper.className.indexOf('explorpc-empty') !== -1) {
						wrapper.className = wrapper.className.replace('explorpc-empty', '');
						editor.setValue('');
					}
				},
				onCursorActivity: function (editor) {
					if (this.highlightedLine) editor.setLineClass(this.highlightedLine, null, null);
					this.highlightedLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
				}, 

			});
			this._bodyEditor.setValueToPlaceholder = function(editor) {
				var placeholder = editor.getTextArea().getAttribute('placeholder'),
					wrapper = editor.getWrapperElement();
				if (wrapper.className.indexOf('explorpc-empty') !== -1) {
					editor.setValue(placeholder);
				}
			};
			this._bodyEditor.getWrapperElement().className += ' explorpc-empty';

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
				auth = this.element.find('[name=auth]').val(),

				totalHeight = this.element.height(),
				// totalHeight - header height - url field height - type/auth/http-method field height - button height - field margins
				bodyHeight = totalHeight - 22 - 34 - 36 - 45 - 24,
				responseHeadersHeight = this.element.find('.explorpc-response-headers').outerHeight(),
				// totalHeight - header height - responseHeadersHeight - padding
				responseBodyHeight = totalHeight - 22 - responseHeadersHeight - 24 - 24;

			if (type !== "raw") {
				bodyHeight -= 34; // method field height
				if (type === "json-rpc") bodyHeight -= 33; // notification field height
			}
			if (auth) {
				bodyHeight -= 24; // username/password
			}
			this.element
				.find('.explorpc-request, .explorpc-response').height(totalHeight).width(sectionWidth).end()
				.find('[name=url], [name=method], .explorpc-response pre').width(inputWidth).end()
				.find('.explorpc-response-body').height(responseBodyHeight)
					.find('pre').height(responseBodyHeight - 22).end().end()
				.find('[name=username], [name=password]').width(authInputsWidth);
			this._bodyEditor.setSize(inputWidth, bodyHeight);
		},

		_expandHover: function(event) {
			$(this).toggleClass('ui-state-hover', (event.type === 'mouseenter'));
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

			this._bodyEditor.setOption('mode', this.getMimeType());
			this._updatePlaceholders();
			this._adjustDimensions();
			this.element.find('.explorpc-body h4').text(this._getRequestBodyLabel());
		},

		_getRequestBodyLabel: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'JSON Params';
				case 'soap':
					return 'SOAP Body';
				case 'xml-rpc':
					return 'XML Payload';
				case 'raw':
					return 'Request Body';
			}
		},

		_updatePlaceholders: function() {
			var type = this.element.find('[name=type]').val();

			$.each(this._placeHolders[type], $.proxy(function(selector, placeholderString) {
				this.element.find(selector).attr('placeholder', placeholderString);
			}, this));

			// set placeholder text
			this._bodyEditor.setValueToPlaceholder(this._bodyEditor);
		},

		getMimeType: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'application/json';
				case 'soap':
					return 'text/xml';
				case 'raw':
				default:
					return 'text/plain';
			}
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
			this._adjustDimensions();
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

			params.contentType = this.getMimeType();
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					params.data = this._getJsonRPCRequestBody();
					break;
				case 'soap':
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
				params = this._bodyEditor.getValue(),
				request = '';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (!this.element.find('[name=notification]:checked').length) request += ',"id": ' + this._getRandomId();
			return request += '}';
		},

		_getRandomId: function() {
			return Math.floor(Math.random() * 99999);
		},

		_getSoapRequestBody: function() {
			var body = this._bodyEditor.getVal(), request = '';
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
				.find('.explorpc-response-headers pre').text('No response headers').end()
				.find('.explorpc-response-body pre').text('No response body').end()
				.dialog({
					'height': 'auto',
					'position': { my: "center", at: "center", of: this.element },
					'dialogClass': 'explorpc-dialog'
				});
		},

		_requestDone: function(data, success, jqXHR) {
			var headers = jqXHR.getAllResponseHeaders(),
				body = jqXHR.responseText,
				tempDiv = document.createElement('div'),
				statusLine = "HTTP/1.1 " + jqXHR.status + " " + jqXHR.statusText + "\n",
				statusType = this._getTypeFromStatus(jqXHR.status);
			
			statusLine = "<span class=\"explorpc-" + statusType + "\">" + statusLine + "</span>";
			CodeMirror.runMode(headers, "message/http", tempDiv);
			this.element.find('.explorpc-response-headers pre').html(statusLine + tempDiv.innerHTML);

			tempDiv.innerHTML = '';
			CodeMirror.runMode(body, this.getMimeType(), tempDiv);
			this.element.find('.explorpc-response-body pre').html(tempDiv.innerHTML);
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
