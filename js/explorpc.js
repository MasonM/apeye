;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		options: {
			// FIELD SETTERS
			type: "json-rpc",
			httpMethod: "post",
			auth: "basic",
			url: "",
			method: "",
			body: "",
			username: "",
			password: "",

			// MISC OPTIONS
			autocompleteSource: null,
			indent: 3,
			timeout: 5 * 1000,
			subdomainTunneling: false,
			autoPrettyPrint: false,
			tunnelFilepath: "/tunnel.html"
		},
		// field names
		paramNames: ['type', 'httpMethod', 'auth', 'url', 'method', 'body', 'username', 'password'],
		// codemirror instance for request body
		_requestBodyEditor: null,
		// codemirror instance for response body
		_responseBodyEditor: null,
		// last response/request data, used by "view raw request/response" dialog
		_lastResponse: null,
		_lastRequestParams: null,
		// flag that indicates _create() has finished element initialization
		_initialized: false,
		// Cache of the jQuery.ajax objects provided by tunnel.html, as served by each of the
		// subdomains we've connected to. This means we only have to fetch tunnel.html once
		// for each subdomain request.
		_subdomainAjax: {},

		_create: function() {
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
					.button({ disabled: true });
			this._initAutocomplete();
			this.setFieldValues();

			// register events
			this.element
				.resize($.proxy(this._adjustDimensions, this))
				.on('change', '[name=type]', $.proxy(this._typeChanged, this))
				.on('change', '[name=httpMethod]', $.proxy(this._httpMethodChanged, this))
				.on('change', '[name=auth]', $.proxy(this._authChanged, this))
				.on('change', '[name=url]', $.proxy(this._urlChanged, this))
				.on('click', '[name=request]:not(.ui-state-disabled)', $.proxy(this._requestClicked, this))
				.on('click', '.explorpc-expand', $.proxy(this.toggleExpand, this))
				.on('click', '.explorpc-h-expand', $.proxy(this.toggleHorizontalExpand, this))
				.on('click', '.explorpc-viewraw:not(.ui-state-disabled)', $.proxy(this.viewRaw, this))
				.on('click', '.explorpc-prettyprint:not(.ui-state-disabled)', $.proxy(this.prettyPrintResponse, this))
				.on('hover', '.explorpc-expand, .explorpc-viewraw, .explorpc-prettyprint', this._buttonHover);

			this._horizontalExpandChanged();
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
					if (editor.hasEmptyFlag()) {
						editor.toggleEmptyFlag();
						editor.setValue('');
					}
				},
				onBlur: function(editor) {
					if (editor.getValue().length === 0) {
						editor.toggleEmptyFlag();
						editor.setValueToPlaceholder();
					}
				},
				//highlight active line
				onCursorActivity: function (editor) {
					if (this.highlightedLine) editor.setLineClass(this.highlightedLine, null, null);
					this.highlightedLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
				}
			});

			this._requestBodyEditor.toggleEmptyFlag = function() {
				var wrapper = this.getWrapperElement();
				if (this.hasEmptyFlag()) {
					wrapper.className = wrapper.className.replace('explorpc-empty', '');
				} else {
					wrapper.className += ' explorpc-empty';	
				}
			};

			this._requestBodyEditor.hasEmptyFlag = function() {
				return this.getWrapperElement().className.indexOf('explorpc-empty') !== -1;
			};

			this._requestBodyEditor.setValueToPlaceholder = function() {
				var placeholder = this.getTextArea().getAttribute('placeholder');
				if (this.hasEmptyFlag()) {
					this.setValue(placeholder);
				}
			};

			this._requestBodyEditor.getActualValue = function() {
				return this.hasEmptyFlag() ? "" : this.getValue();
			};

			if (!this.option('body').length) {
				this._requestBodyEditor.toggleEmptyFlag();	
			}
		},

		_initResponseBody: function() {
			this._responseBodyEditor = CodeMirror.fromTextArea(this.element.find('[name=responseBody]')[0], {
				lineNumbers: false,
				indentUnit: this.option('indent'),
				readOnly: true
			});
		},

		setFieldValues: function() {
			var self = this;
			$.each(this.paramNames, function(i, fieldName) {
				var value = self.option(fieldName);
				if (fieldName === 'body') {
					self._requestBodyEditor.setValue(value);
					if (value.length > 0 && self._requestBodyEditor.hasEmptyFlag()) {
						self._requestBodyEditor.toggleEmptyFlag();
					}
				} else {
					self.element.find('[name=' + fieldName + ']').val(value);
				}
			});
			this._httpMethodChanged();
			this._authChanged();
			this._typeChanged();
			this._urlChanged();
		},

		_initAutocomplete: function() {
			var source = this.option('autocompleteSource');
			if (!source) return;

			if (typeof source === "string") {
				// treat as WSDL file that must be requested and parsed
				if (this.option('subdomainTunneling')) {
					this._tunnelRequest(this._getLocation(source), this._initAutocompleteWsdl);
				} else {
					this._initAutocompleteWsdl($.ajax);
				}
			} else {
				if (!$.isArray(source)) {
					// treat as function
					var self = this;
					source = function(request, response) {
						source(self.element.find('[name=url]').val(), request, response);
					};
				}
				this.element.find('[name=method]')
					.autocomplete({ source: source, appendTo: this.element });
			}
		},

		_initAutocompleteWsdl: function(ajax) {
			var self = this;
			ajax({
				url: this.option('autocompleteSource'),
				method: "GET",
				dataType: "xml"
			})
			.done(function(data) {
				var methodNames = $(data).find('operation').map(function() {
					return this.getAttribute('name');
				}).toArray();
				self.element.find('[name=method]')
					.autocomplete({ source: $.unique(methodNames), appendTo: self.element });
			});
		},

		_adjustDimensions: function() {
			if (!this._initialized) {
				// avoid unnecessary calls during initialization
				return;
			}
			var hExpand = this.element.hasClass('explorpc-horizontal-expanded'),
				totalHeight = this.element.height(),
				sectionHeight = (hExpand ? (totalHeight / 2) : totalHeight) - 3,
				// requestBodyHeight = sectionHeight - borders - top margin of request body
				requestBodyHeight = sectionHeight - 2 - 6,
				responseHeadersHeaderHeight = this.element.find('.explorpc-response-headers-header').outerHeight(true),
				responseBodyHeaderHeight = this.element.find('.explorpc-response-body-header').outerHeight(true),
				// Give the headers 40% of the available height, and the body 60%
				// ((sectionHeight - header height) * percentage) - h4 height - .field margins
				responseHeadersHeight = ((sectionHeight- 22) * 0.4) - responseHeadersHeaderHeight- 18,
				// ((sectionHeight - header height) * percentage) - h4 height - .field margins
				responseBodyHeight = ((sectionHeight - 22) * 0.6) - responseBodyHeaderHeight - 18;

			// compute request body height by subtracting height of each of its siblings (plus the bottom margin)
			this.element
				.find('.explorpc-body')
				.siblings(':visible:not(.explorpc-h-expand)')
				.each(function(i, element) {
					requestBodyHeight -= ($(element).outerHeight() + 12);
				});

			this.element.find('.explorpc-response-headers').height(responseHeadersHeight);
			this._requestBodyEditor.setSize(null, requestBodyHeight + "px");
			this._responseBodyEditor.setSize(null, responseBodyHeight + "px");
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
			this.element.toggleClass('explorpc-horizontal-expanded');
			this._horizontalExpandChanged();
		},

		_horizontalExpandChanged: function() {
			var isExpanded = this.element.hasClass('explorpc-horizontal-expanded');
			this.element.find('.explorpc-h-expand span')
					.removeClass('ui-icon-triangle-1-e ui-icon-triangle-1-w')
					.addClass(function() {
						return 'ui-icon-triangle-1-' + (isExpanded ? 'w' : 'e');
					});
			this._adjustDimensions();
		},

		viewRaw: function() {
			var loc = this._getLocation(this._lastRequestParams.url),
				html = "";
			
			html = "<h4>HTTP Request (incomplete)</h4>\n" +
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
				"<h4>HTTP Response</h1>\n" +
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
		
		prettyPrintResponse: function() {
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
				.removeClass('explorpc-json-rpc explorpc-soap11 explorpc-soap12 explorpc-xml-rpc explorpc-raw')
				.addClass('explorpc-' + type);

			if (type === 'json-rpc' || type === 'soap11' || type === 'soap12' || type === 'xml-rpc') {
				httpMethodSelect.val('post').attr('disabled', true);
				this._httpMethodChanged();
			} else {
				httpMethodSelect.removeAttr('disabled');
			}

			this._requestBodyEditor.setOption('mode', this.getMimeType());
			this._adjustDimensions();

			this.element
				.find('.explorpc-request-body-header')
					.text(this._getRequestBodyHeader())
					.end()
				.find('.explorpc-method span')
					.text(this._getMethodLabel())
					.end()
				.find('[name=body]')
					.attr('placeholder', this._getRequestBodyPlaceholder());

			// set placeholder text
			this._requestBodyEditor.setValueToPlaceholder();
		},

		_getMethodLabel: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'soap11':
				case 'soap12':
					return 'SOAPAction';
				default:
					return 'Method';
			}
		},

		_getRequestBodyHeader: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'JSON Params';
				case 'soap11':
				case 'soap12':
					return 'SOAP Body';
				case 'xml-rpc':
					return 'XML <params>';
				case 'raw':
					return 'Request Body';
			}
		},

		_getRequestBodyPlaceholder: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return "[\"Hello JSON-RPC\"]";
				case 'soap11':
				case 'soap12':
					return "<m:alert xmlns:m=\"http://example.org/alert\">\n\t<m:msg>Pickup Mary</m:msg>\n</m:alert>";
				case 'xml-rpc':
					return "<params>\n\t<param><value>foo</value></param>\n\t</params>";
			}
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

		_urlChanged: function(event) {
			var url = this.element.find('[name=url]').val();
			this.element
				.find('[name=request]')
				.data('button')
				.option('disabled', url.length === 0);
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
				this._tunnelRequest(this._getLocation(this.getFullUrl()), this._doRequest);
			} else {
				this._doRequest($.ajax);
			}
		},

		_tunnelRequest: function(loc, onSuccess) {
			// only do subdomain tunneling if request URL has a different hostname but the
			// same domain suffix as document.domain
			if (loc.host !== window.location.host && loc.hostname.match(document.domain + "$")) {
				if (!this._subdomainAjax[loc.host]) {
					var self = this;
					$('<iframe>')
						.attr('src', loc.protocol + '//' + loc.host + this.option('tunnelFilepath'))
						.load(function() {
							self._subdomainAjax[loc.host] = this.contentWindow.jQuery.ajax;
							onSuccess.call(self, self._subdomainAjax[loc.host]);
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
				case 'xml-rpc':
					params.data = this._getXMLRPCRequestBody();
					break;
				case 'soap11':
				case 'soap12':
					params.headers.SOAPAction = this.element.find('[name=method]').val();
					params.data = this._getSoapRequestBody();
					break;
				case 'raw':
					params.data = this._requestBodyEditor.getActualValue();
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
				params = this._requestBodyEditor.getActualValue(),
				request = '';

			if (!params) params = '[]';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (!this.element.find('[name=notification]:checked').length) request += ',"id": ' + this._getRandomId();
			return request + '}';
		},

		_getRandomId: function() {
			return Math.floor(Math.random() * 99999);
		},

		_getSoapRequestBody: function() {
			var body = this._requestBodyEditor.getActualValue(),
				type = this.element.find('[name=type]').val(),
				request = '<?xml version="1.0" encoding="UTF-8"?>';

			if (type === 'soap11') {
				request += '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
					' soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
			} else {
				request += '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">';
			}
			// @todo Add support for setting SOAP headers
			request += '<soap:Header/>' +
					'<soap:Body>' + body + '</soap:Body>' +
				'</soap:Envelope>';
			return request;
		},

		_getXMLRPCRequestBody: function() {
			var body = this._requestBodyEditor.getActualValue(),
				method = this.element.find('[name=method]').val(),
				request = '<?xml version="1.0" encoding="UTF-8"?>';
			request += '<methodCall><methodName>' + method + '</methodName>' + body + '</methodCall>';
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
				.find('.explorpc-viewraw, .explorpc-prettyprint')
				.removeClass('ui-state-disabled');
			
			statusLine = "<span class=\"explorpc-" + statusType + "\">" + this._getLastStatusLine() + "</span>";
			CodeMirror.runMode(headers, "message/http", tempDiv);
			this.element
				.find('.explorpc-response-headers pre')
				.html(statusLine + tempDiv.innerHTML);

			this._responseBodyEditor.setOption('mode', this.getMimeType());
			this._responseBodyEditor.setValue(body);

			if (this.option('autoPrettyPrint')) {
				this.prettyPrintResponse();
			}
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
			} else if (status >= 500 && status < 600) {
				return "server-error";
			} else {
				return "unknown";
			}
		},

		destroy: function () {
			$.Widget.prototype.destroy.call(this);
		}
	});

	$.widget.bridge("explorpc", $.mm.explorpc);
})(jQuery, window, document);
