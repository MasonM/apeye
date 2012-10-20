;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		options: {
			type: "json-rpc",
			httpMethod: "post",
			auth: "basic",
			url: "",
			method: "",
			body: "",	
			timeout: 5 * 1000,
		},

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

		_lastResponse: null,

		_lastRequestParams: null,

		_initialized: false,

		_create: function() {
			var self = this;
			$.each(['type', 'httpMethod', 'auth', 'url', 'method', 'body'], function(i, fieldName) {
				self.element.find('[name=' + fieldName + ']').val(self.option(fieldName));
			});

			this._initRequestBody();

			this.element
				.resizable({ handles: 'se', }).find('.ui-resizable-se').addClass('ui-icon-grip-diagonal-se').end()
				.resize($.proxy(this._adjustDimensions, this))
				.delegate('[name=type]', 'change', $.proxy(this._typeChanged, this))
				.delegate('[name=httpMethod]', 'change', $.proxy(this._httpMethodChanged, this))
				.delegate('[name=auth]', 'change', $.proxy(this._authChanged, this))
				.delegate('[name=request]', 'click', $.proxy(this._doRequest, this))
				.delegate('.explorpc-expand', 'click', $.proxy(this.toggleExpand, this))
				.delegate('.explorpc-viewraw:not(.ui-state-disabled)', 'click', $.proxy(this.viewRaw, this))
				.find('.explorpc-expand, .explorpc-viewraw').hover(this._buttonHover).end()
				.find('button').button();

			this._httpMethodChanged();
			this._authChanged();
			this._typeChanged();

			this._initialized = true;
			this._adjustDimensions();
		},

		_initRequestBody: function() {
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
			if (!this.option('body').length) {
				this._bodyEditor.getWrapperElement().className += ' explorpc-empty';
			}
		},

		_adjustDimensions: function() {
			if (!this._initialized) {
				// avoid unnecessary calls during initialization
				return;
			}
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
				// totalHeight - header height - url field height - type/auth/http-method field height - header height - button height - field margins
				requestBodyHeight = totalHeight - 22 - 34 - 36 - 22 - 45 - 24,

				// Give the headers 40% of the available height, and the body 60%
				// ((totalHeight - header height) * percentage) - upper/lower field margins
				responseHeadersHeight = ((totalHeight - 22) * 0.4) - 24,
				// responseHeadersHeight - h4 height - border/padding
				responseHeadersPreHeight = responseHeadersHeight - 28 - 12,
				// ((totalHeight - header height) * percentage) - lower field margins
				responseBodyHeight = ((totalHeight - 22) * 0.6) - 12,
				// responseBodyHeight - h4 height - border/padding
				responseBodyPreHeight = responseBodyHeight - 28 - 12;

			if (type !== "raw") {
				requestBodyHeight -= 34; // method field height
				if (type === "json-rpc") requestBodyHeight -= 33; // notification field height
			}
			if (auth) {
				requestBodyHeight -= 24; // username/password
			}
			this.element
				.find('.explorpc-request, .explorpc-response').height(totalHeight).width(sectionWidth).end()
				.find('[name=url], [name=method], .explorpc-response pre').width(inputWidth).end()
				.find('.explorpc-response-body').height(responseBodyHeight)
					.find('pre').height(responseBodyPreHeight).end().end()
				.find('.explorpc-response-headers').height(responseHeadersHeight)
					.find('pre').height(responseHeadersPreHeight).end().end()
				.find('[name=username], [name=password]').width(authInputsWidth);
			this._bodyEditor.setSize(inputWidth, requestBodyHeight);
		},

		_buttonHover: function(event) {
			$(this).toggleClass('ui-state-hover', (event.type === 'mouseenter' && !$(this).hasClass('ui-state-disabled')));
		},

		toggleExpand: function(event) {
			this.element
				.css('height', '')
				.css('width', '')
				.toggleClass('explorpc-expanded');
			this._adjustDimensions();
		},

		viewRaw: function() {
			var loc = this._getLocation(this._lastRequestParams.url),
				html = "";
			
			html = "<h4 class='ui-widget-header ui-corner-all'>HTTP Request (incomplete)</h4>\n" +
				"<pre>" +
				this._lastRequestParams.type + " " + loc.pathname + " HTTP/1.1\n" +
				"Host: " + loc.host + "\n\n" +
				this._escapeHTML(this._lastRequestParams.data ? this._lastRequestParams.data : '') +
				"</pre>\n" +
				"<h4 class='ui-widget-header ui-corner-all'>HTTP Response</h1>\n" +
				"<pre>" +
				this._getLastStatusLine() +
				this._lastResponse.getAllResponseHeaders() + "\n" +
				this._escapeHTML(this._lastResponse.responseText);
				
			this.element.find('.explorpc-dialog').html(html).dialog({
				'title': 'Raw request and response',
				'height': 'auto',
				'position': { my: "center", at: "center", of: this.element },
				'dialogClass': 'explorpc-dialog',
				'close': this._getCloseDialogCallback()
			});
		},

		_escapeHTML: function(html) {
			return html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		},

		_getLocation: function(href) {
			var l = document.createElement("a");
			l.href = href;
			return l;
		},

		_typeChanged: function(event) {
			var type = this.element.find('[name=type]').val(),
				httpMethodSelect = this.element.find('[name=httpMethod]');

			this.element
				.removeClass('explorpc-json-rpc explorpc-soap explorpc-raw')
				.addClass('explorpc-' + type);

			if (type === 'json-rpc' || type === 'soap') {
				httpMethodSelect.val('post').attr('disabled', true);
				this._httpMethodChanged();
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
				.removeClass('explorpc-method-post explorpc-method-put explorpc-method-get explorpc-method-delete explorpc-method-trace')
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
				case 'raw':
					params.data = this._bodyEditor.getValue();
					break;
			}

			this._lastRequestParams = params;

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
			var body = this._bodyEditor.getValue(), request = '';
			request = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:enc="http://www.w3.org/2003/05/soap-encoding">' +
					'<env:Body>' + body + '</env:Body>' +
				'</env:Envelope>';
			return request;
		},

		_requestError: function(jqXHR) {
			if (jqXHR.status >= 200) {
				return this._requestDone(null, null, jqXHR);
			}
			var errorDesc = "Request failed. Error #" + jqXHR.status + ": " + jqXHR.statusText;

			this.element
				.find('.explorpc-response-headers pre').text('No response headers').end()
				.find('.explorpc-response-body pre').text('No response body').end()
				.find('.explorpc-dialog').text(errorDesc).dialog({
					'title': 'Request failed',
					'height': 'auto',
					'position': { my: "center", at: "center", of: this.element },
					'dialogClass': 'explorpc-dialog',
					'close': this._getCloseDialogCallback()
				});
		},

		_getCloseDialogCallback: function() {
			// workaround for jQuery bug: http://bugs.jqueryui.com/ticket/5762
			var dialogElem = this.element.find('.explorpc-dialog'),
				element = this.element;
			return function () {
				dialogElem.dialog('destroy');
				dialogElem.appendTo(element);
			};
		},

		_getLastStatusLine: function() {
			return "HTTP/1.1 " + this._lastResponse.status + " " + this._lastResponse.statusText + "\n";
		},

		_requestDone: function(data, success, jqXHR) {
			var headers = jqXHR.getAllResponseHeaders(),
				body = jqXHR.responseText,
				tempDiv = document.createElement('div'),
				statusLine = '',
				statusType = this._getTypeFromStatus(jqXHR.status);

			this._lastResponse = jqXHR;
			this.element.find('.explorpc-viewraw').removeClass('ui-state-disabled');
			
			statusLine = "<span class=\"explorpc-" + statusType + "\">" + this._getLastStatusLine() + "</span>";
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
