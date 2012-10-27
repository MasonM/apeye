;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		paramNames: ['type', 'httpMethod', 'auth', 'url', 'method', 'body', 'username', 'password'],
		options: {
			type: "json-rpc",
			httpMethod: "post",
			auth: "basic",
			url: "",
			method: "",
			body: "",	
			username: "",
			password: "",
			indent: 3,
			timeout: 5 * 1000,
			subdomainTunneling: false
		},
		// codemirror instance for request body
		_requestBodyEditor: null,
		// codemirror instance for response body
		_responseBodyEditor: null,
		_lastResponse: null,
		_lastRequestParams: null,
		_initialized: false,
		// cache of each jQuery.ajax object for the subdomains we've connected to, so we
		// don't have to keep requesting tunnel.html
		_subdomainAjax: {},

		_create: function() {
			// set field values
			var self = this;
			$.each(this.paramNames, function(i, fieldName) {
				self.element.find('[name=' + fieldName + ']').val(self.option(fieldName));
			});

			// initialize CodeMirror instances
			this._initRequestBody();
			this._initResponseBody();
			
			// initialize elements
			this.element
				.resizable({ handles: 'se' })
				.find('.ui-resizable-se')
					.addClass('ui-icon-grip-diagonal-se')
					.end()
				.find('button')
					.button();

			// register events
			this.element
				.resize($.proxy(this._adjustDimensions, this))
				.delegate('[name=type]', 'change', $.proxy(this._typeChanged, this))
				.delegate('[name=httpMethod]', 'change', $.proxy(this._httpMethodChanged, this))
				.delegate('[name=auth]', 'change', $.proxy(this._authChanged, this))
				.delegate('[name=request]:not(.ui-state-disabled)', 'click', $.proxy(this._requestClicked, this))
				.delegate('.explorpc-expand', 'click', $.proxy(this.toggleExpand, this))
				.delegate('.explorpc-h-expand', 'click', $.proxy(this.toggleHorizontalExpand, this))
				.delegate('.explorpc-viewraw:not(.ui-state-disabled)', 'click', $.proxy(this.viewRaw, this))
				.delegate('.explorpc-autoformat:not(.ui-state-disabled)', 'click', $.proxy(this.autoFormatBody, this))
				.delegate('.explorpc-expand, .explorpc-viewraw, .explorpc-autoformat', 'hover', this._buttonHover);

			this._httpMethodChanged();
			this._authChanged();
			this._typeChanged();
			this._initialized = true;
			this._adjustDimensions();
		},

		_initRequestBody: function() {
			this._requestBodyEditor = CodeMirror.fromTextArea(this.element.find('[name=body]')[0], {
				lineNumbers: false,
				matchBrackets: true,
				indentUnit: this.option('indent'),
				// emulate HTML placeholders
				onFocus: function(editor) {
					var wrapper = editor.getWrapperElement();
					if (wrapper.className.indexOf('explorpc-empty') !== -1) {
						wrapper.className = wrapper.className.replace('explorpc-empty', '');
						editor.setValue('');
					}
				},
				onBlur: function(editor) {
					if (editor.getValue().length === 0) {
						editor.getWrapperElement().className += ' explorpc-empty';
						editor.setValueToPlaceholder(editor);
					}
				},
				//highlight active line
				onCursorActivity: function (editor) {
					if (this.highlightedLine) editor.setLineClass(this.highlightedLine, null, null);
					this.highlightedLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
				}
			});

			this._requestBodyEditor.setValueToPlaceholder = function(editor) {
				var placeholder = editor.getTextArea().getAttribute('placeholder'),
					wrapper = editor.getWrapperElement();
				if (wrapper.className.indexOf('explorpc-empty') !== -1) {
					editor.setValue(placeholder);
				}
			};

			if (!this.option('body').length) {
				this._requestBodyEditor.getWrapperElement().className += ' explorpc-empty';
			}
		},

		_initResponseBody: function() {
			this._responseBodyEditor = CodeMirror.fromTextArea(this.element.find('[name=responseBody]')[0], {
				lineNumbers: false,
				indentUnit: this.option('indent'),
				readOnly: true
			});
		},

		_adjustDimensions: function() {
			if (!this._initialized) {
				// avoid unnecessary calls during initialization
				return;
			}
			var totalWidth = this.element.width(),
				hExpand = this.element.hasClass('explorpc-horizontal-expanded'),
				// subtract 3 pixels for the borders
				sectionWidth = (hExpand ? totalWidth : (totalWidth / 2)) - 3,
				// sectionWidth - input margins - .field top/bottom margins
				inputWidth = sectionWidth - 8 - 24,
				authTypeWidth = this.element.find('[name=auth]').outerWidth(true),
				// the auth type select and the inputs should be on the same line
				authInputsWidth = ((inputWidth - authTypeWidth) / 2) - 4,

				totalHeight = this.element.height(),
				sectionHeight = (hExpand ? (totalHeight / 2) : totalHeight) - 3,
				// sectionHeight - borders - bottom margin
				requestBodyHeight = sectionHeight - 2 - 12,

				// Give the headers 40% of the available height, and the body 60%
				// ((sectionHeight - header height) * percentage) - h4 height - .field margins
				responseHeadersHeight = ((sectionHeight- 22) * 0.4) - 28 - 24,
				// ((sectionHeight - header height) * percentage) - h4 height - .field margins
				responseBodyHeight = ((sectionHeight - 22) * 0.6) - 28 - 24;

			this.element
				.find('.explorpc-request, .explorpc-response')
					.height(sectionHeight)
					.width(sectionWidth)
					.end()
				.find('[name=url], [name=method], .explorpc-response-headers pre')
					.width(inputWidth)
					.end()
				.find('.explorpc-response-body')
					.height(responseBodyHeight)
					.end()
				.find('.explorpc-response-headers')
					.height(responseHeadersHeight)
					.end()
				.find('[name=username], [name=password]')
					.width(authInputsWidth);

			// compute request body height by subtracting height of each of its siblings (plus the bottom margin)
			this.element
				.find('.explorpc-body')
				.siblings(':visible:not(.explorpc-h-expand)')
				.each(function(i, element) {
					requestBodyHeight -= ($(element).outerHeight() + 12);
				});

			this._requestBodyEditor.setSize(inputWidth, requestBodyHeight);
			this._responseBodyEditor.setSize(inputWidth, responseBodyHeight);
		},

		_buttonHover: function(event) {
			var isHovering = event.type === 'mouseenter' && !$(this).hasClass('ui-state-disabled');
			$(this).toggleClass('ui-state-hover', isHovering);
		},

		toggleExpand: function(event) {
			this.element
				.css('height', '')
				.css('width', '')
				.toggleClass('explorpc-expanded');

			this._adjustDimensions();
		},

		toggleHorizontalExpand: function(event) {
			var element = this.element,
				className = 'explorpc-horizontal-expanded';

			element
				.toggleClass(className)
				.find('.explorpc-h-expand span')
					.removeClass('ui-icon-triangle-1-e ui-icon-triangle-1-w')
					.addClass(function() {
						return 'ui-icon-triangle-1-' + (element.hasClass(className) ? 'w' : 'e');
					});

			this._adjustDimensions();
		},

		viewRaw: function() {
			var loc = this._getLocation(this._lastRequestParams.url),
				html = "";
			
			html = "<h4 class='ui-widget-header ui-corner-all'>HTTP Request (incomplete)</h4>\n" +
				"<pre>" +
				this._lastRequestParams.type + " " + loc.pathname + " HTTP/1.1\n" +
				"Host: " + loc.host + "\n";
			if (this._lastRequestParams.headers) {
				$.each(this._lastRequestParams.headers, function (name, value) {
					html += name + ": " + value + "\n";
				});
			}
			html += "\n" +
				this._escapeHTML(this._lastRequestParams.data ? this._lastRequestParams.data : '') +
				"</pre>\n" +
				"<h4 class='ui-widget-header ui-corner-all'>HTTP Response</h1>\n" +
				"<pre>" +
				this._getLastStatusLine() +
				this._lastResponse.getAllResponseHeaders() + "\n" +
				this._escapeHTML(this._lastResponse.responseText) + 
				"</pre>";
				
			this.element
				.find('.explorpc-dialog')
				.html(html)
				.dialog({
					'title': 'Raw request and response',
					'height': 'auto',
					'position': { my: "center", at: "center", of: this.element },
					'dialogClass': 'explorpc-dialog',
					'close': this._getCloseDialogCallback()
				});
		},
		
		autoFormatBody: function() {
			var lastLineIndex = this._responseBodyEditor.lineCount() - 1,
				lastLine = this._responseBodyEditor.getLine(lastLineIndex),
				range = {
					from: { line: 0, ch: 0 },
					to: { line: lastLineIndex, ch: lastLine.length }
				};
			this._responseBodyEditor.autoFormatRange(range.from, range.to);
		},

		_escapeHTML: function(html) {
			return html
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
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
				.removeClass('explorpc-json-rpc explorpc-soap11 explorpc-soap12 explorpc-raw')
				.addClass('explorpc-' + type);

			if (type === 'json-rpc' || type === 'soap11' || type === 'soap12') {
				httpMethodSelect.val('post').attr('disabled', true);
				this._httpMethodChanged();
			} else {
				httpMethodSelect.removeAttr('disabled');
			}

			this._requestBodyEditor.setOption('mode', this.getMimeType());
			this._updatePlaceholders();
			this._adjustDimensions();

			this.element
				.find('.explorpc-body h4')
				.text(this._getRequestBodyLabel());
		},

		_getRequestBodyLabel: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'JSON Params';
				case 'soap11':
				case 'soap12':
					return 'SOAP Body';
				case 'xml-rpc':
					return 'XML Payload';
				case 'raw':
					return 'Request Body';
			}
		},

		_updatePlaceholders: function() {
			var placeholders = {"method": '', "body": ''};
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					placeholders.method = "Method name";
					placeholders.body = "[\"Hello JSON-RPC\"]";
					break;
				case 'soap11':
				case 'soap12':
					placeholders.method = "SOAPAction header";
					placeholders.body = "<m:alert xmlns:m=\"http://example.org/alert\">\n\t<m:msg>Pickup Mary</m:msg>\n</m:alert>";
					break;
				case 'xml-rpc':
					placeholders.method = "Method name";
					placeholders.body = "<params>\n\t<param><value>foo</value></param>\n\t</params>";
					break;
			}

			$.each(placeholders, $.proxy(function(name, placeholderString) {
				this.element.find('[name=' + name + ']').attr('placeholder', placeholderString);
			}, this));

			// set placeholder text
			this._requestBodyEditor.setValueToPlaceholder(this._requestBodyEditor);
		},

		getMimeType: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'application/json';
				case 'soap11':
				case 'soap12':
				case 'xml-rpc':
					return 'text/xml';
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
			this.element.toggleClass('explorpc-auth-basic', auth === 'basic');
			this._adjustDimensions();
		},

		_requestClicked: function(event) {
			var responseSection = this.element.find('.explorpc-response');

			this.element
				.find('[name=request]')
					.addClass('ui-state-disabled')
					.end()
				.find('.explorpc-spinner')
					.show()
					.position({ of: responseSection });

			responseSection.fadeTo(0, 0.5);

			if (this.option('subdomainTunneling')) {
				this._tunnelRequest();
			} else {
				this._doRequest($.ajax);
			}
		},

		_tunnelRequest: function() {
			var loc = this._getLocation(this.getFullUrl());

			// only do subdomain tunneling if request URL has a different hostname but the
			// same domain suffix as document.domain
			if (loc.host !== window.location.host && loc.hostname.match(document.domain + "$")) {
				if (!this._subdomainAjax[loc.host]) {
					var self = this;
					$('<iframe>')
						.attr('src', loc.protocol + '//' + loc.host + '/tunnel.html')
						.load(function() {
							self._subdomainAjax[loc.host] = this.contentWindow.jQuery.ajax;
							self._doRequest(self._subdomainAjax[loc.host]);
						})
						.appendTo('head');
				} else {
					this._doRequest(this._subdomainAjax[loc.host]);
				}
			} else {
				this._doRequest($.ajax);
			}
		},

		getFullUrl: function() {
			var url = this.element.find('[name=url]').val();
			if (!url.match(/^https?:\/\//)) {
				url = window.location.protocol + '//' + url;
			}
			return url;
		},

		_doRequest: function(ajax) {
			var params = {};
			params.type = this.element.find('[name=httpMethod]').val().toUpperCase();
			params.url = this.getFullUrl();
			params.dataType = 'text';
			params.timeout = this.option('timeout');
			params.processData = false;
			params.headers = {};

			if (this.element.find('[name=auth]').val() === 'basic') {
				var username = this.element.find('[name=username]').val(),
					password = this.element.find('[name=password]').val();
				params.headers.Authorization = 'Basic ' + window.btoa(username + ":" + password);
			}

			params.contentType = this.getMimeType();
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					params.data = this._getJsonRPCRequestBody();
					break;
				case 'soap11':
				case 'soap12':
					params.headers.SOAPAction = this.element.find('[name=method]').val();
					params.data = this._getSoapRequestBody();
					break;
				case 'raw':
					params.data = this._requestBodyEditor.getValue();
					break;
			}

			this._lastRequestParams = params;

			var req = ajax(params)
				.fail($.proxy(this._requestError, this))
				.done($.proxy(this._requestSuccess, this))
				.always($.proxy(this._requestDone, this));
		},

		_getJsonRPCRequestBody: function() {
			var method = this.element.find('[name=method]').val(),
				params = this._requestBodyEditor.getValue(),
				request = '';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (!this.element.find('[name=notification]:checked').length) request += ',"id": ' + this._getRandomId();
			return request + '}';
		},

		_getRandomId: function() {
			return Math.floor(Math.random() * 99999);
		},

		_getSoapRequestBody: function() {
			var body = this._requestBodyEditor.getValue(),
				type = this.element.find('[name=type]').val(),
				request = '<?xml version="1.0" encoding="UTF-8"?>';

			if (type === 'soap11') {
				request += '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
					' soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
			} else {
				request += '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">';
			}
			request += '<soap:Header/>' +
					'<soap:Body>' + body + '</soap:Body>' +
				'</soap:Envelope>';
			return request;
		},

		_requestError: function(jqXHR) {
			if (jqXHR.status >= 200) {
				return this._requestSuccess(null, null, jqXHR);
			}
			var errorDesc = "Request failed. Error #" + jqXHR.status + ": " + jqXHR.statusText;

			this.element
				.find('.explorpc-response-headers pre')
					.text('No response headers')
					.end()
				.find('.explorpc-dialog')
					.text(errorDesc)
					.dialog({
						'title': 'Request failed',
						'height': 'auto',
						'position': { my: "center", at: "center", of: this.element },
						'dialogClass': 'explorpc-dialog',
						'close': this._getCloseDialogCallback()
					});

			this._responseBodyEditor.setValue('');
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

		_requestSuccess: function(data, success, jqXHR) {
			var headers = jqXHR.getAllResponseHeaders(),
				body = jqXHR.responseText,
				tempDiv = document.createElement('div'),
				statusLine = '',
				statusType = this._getTypeFromStatus(jqXHR.status);

			this._lastResponse = jqXHR;
			this.element
				.find('.explorpc-viewraw, .explorpc-autoformat')
				.removeClass('ui-state-disabled');
			
			statusLine = "<span class=\"explorpc-" + statusType + "\">" + this._getLastStatusLine() + "</span>";
			CodeMirror.runMode(headers, "message/http", tempDiv);
			this.element
				.find('.explorpc-response-headers pre')
				.html(statusLine + tempDiv.innerHTML);

			this._responseBodyEditor.setOption('mode', this.getMimeType());
			this._responseBodyEditor.setValue(body);
		},

		_requestDone: function() {
			this.element
				.find('[name=request]')
					.removeClass('ui-state-disabled')
					.end()
				.find('.explorpc-response')
					.fadeTo(0, 1)
					.end()
				.find('.explorpc-spinner')
					.hide();
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
