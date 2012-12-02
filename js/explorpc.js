;(function ($, window, document, undefined) {
	"use strict";
	$.widget("mm.explorpc", {
		options: {
			// FIELD SETTERS
			type: "raw",
			httpMethod: "post",
			auth: "",
			url: "",
			method: "",
			body: "",
			username: "",
			password: "",

			// MISC OPTIONS
			autocompleteSource: null,
			permalinkHandler: null,
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
		// codemirror instance for response
		_responseEditor: null,
		// last response/request data, used by "view raw request/response" dialog and permalink functionality
		_lastResponse: null,
		_lastRequestParams: null,
		// Cache of the jQuery.ajax objects provided by tunnel.html, as served by each of the
		// subdomains we've connected to. This means we only have to fetch tunnel.html once
		// for each subdomain request.
		_subdomainAjax: {},

		_create: function() {
			// initialize CodeMirror instances
			this._initRequestBody();
			this._initResponse();

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
				.on('click', '.explorpc-permalink:not(.ui-state-disabled)', $.proxy(this.generatePermanentLink, this))
				.on('hover', '.explorpc-permalink, .explorpc-expand, .explorpc-viewraw, .explorpc-prettyprint', this._buttonHover);
			
			// initialize elements
			this.element
				.toggleClass('explorpc-autoprettyprint', this.option('autoPrettyPrint'))
				.toggleClass('explorpc-canpermalink', this.option('permalinkHandler') !== null)
				.resizable({ handles: 'se' }) // not sure how useful this is. Keep?
				.find('.ui-resizable-se')
					.addClass('ui-icon-grip-diagonal-se') // I want the bigger grip icon (default is too small)
					.end()
				.find('button')
					.button({ disabled: true });
			this._initAutocomplete();
			this._initFields();

			this._horizontalExpandChanged();
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

			// lotta monkey patching for the HTML5 placeholder-emulation functionality
			// @todo generalize this and file a pull request with CodeMirror
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

		_initResponse: function() {
			this._responseEditor = CodeMirror.fromTextArea(this.element.find('[name=response]')[0], {
				lineNumbers: false,
				indentUnit: this.option('indent'),
				readOnly: true
			});
			this._setResponseMode('text/plain');
		},

		_setResponseMode: function(innerMode) {
			// defineMode() will overwrite the existing "response" mode, if already defined
			CodeMirror.defineMode("explorpcResponse", function(config) {
				return CodeMirror.multiplexingMode(
					CodeMirror.getMode(config, "message/http"), {
						open: "\n",
						// seems CodeMirror requires "close", even though we'll never need it
						close: "\0",
						mode: CodeMirror.getMode(config, innerMode)
					}
				);
			});
			this._responseEditor.setOption('mode', 'explorpcResponse');
		},

		_initFields: function() {
			$.each(this.paramNames, $.proxy(function(i, fieldName) {
				this._setField(fieldName, this.option(fieldName));
			}, this));
		},

		_initAutocomplete: function() {
			var source = this.option('autocompleteSource'),
				method = this.element.find('[name=method]');
			if (!source) return;

			method.autocomplete({
				appendTo: this.element,
				minLength: 0
			}).focus(function() {
				// show autocomplete list when input is focused
				if (this.value === "") $(this).trigger('keydown.autocomplete');
			});
			if (typeof source === "string") {
				// treat the source as WSDL file that must be requested and parsed
				method.autocomplete('disable');
				if (this.option('subdomainTunneling')) {
					this.tunnelRequest(source, this._initAutocompleteWsdl);
				} else {
					this._initAutocompleteWsdl($.ajax);
				}
			} else {
				if (!$.isArray(source)) {
					// treat the source as function (jquery UI will handle calling the function)
					var self = this;
					source = function(request, response) {
						source(self.getFieldValue('url'), request, response);
					};
				} // else treat source as an array (handled automatically by jQuery UI)
				method.autocomplete('option', 'source', source);
			}
		},

		_initAutocompleteWsdl: function(ajax) {
			var self = this;
			ajax({
				url: this.option('autocompleteSource'),
				type: "GET",
				dataType: "text"
			})
			.done(function(data) {
				// Ideally I'd let jQuery automatically parse the XML and use $(data).find('operation'),
				// but unfortunately that doesn't work in IE and FF due to jQuery's broken handling of XML
				// namespaces. See http://bugs.jquery.com/ticket/155
				//
				// Instead, I'll parse it manually with DOMParser. This won't work in IE8, since IE8
				// doesn't support DOMParser or getElementsByTagNameNS. Working around it would be too
				// much work, so I'm just going to not support IE8.
				var parser = new DOMParser(),
					xmlDoc = parser.parseFromString(data, "text/xml"),
					portType = xmlDoc.getElementsByTagNameNS('*', 'portType')[0],
					methodNames = [];
				if (!portType) return;
				$.each(portType.getElementsByTagNameNS('*', 'operation'), function() {
					var name = this.getAttribute('name');
					if (name) methodNames.push(name);
				});
				self.element
					.find('[name=method]')
					.autocomplete('option', 'source', methodNames)
					.autocomplete('enable');
			});
		},

		_setOption: function(key, value) {
			$.Widget.prototype._setOption.apply(this, arguments);
			if ($.inArray(key, this.paramNames) !== -1) {
				this._setField(key, value);
			} else if (key === 'autoPrettyPrint') {
				this.element.toggleClass('explorpc-autoprettyprint', value);
			}
		},

		_setField: function(key, value) {
			if (key === 'body') {
				this._requestBodyEditor.setValue(value);
				if (value.length > 0 && this._requestBodyEditor.hasEmptyFlag()) {
					this._requestBodyEditor.toggleEmptyFlag();
				}
			} else {
				this.element
					.find('[name=' + key + ']')
					.val(value)
					.trigger('change');
			}
		},

		setFieldsFromString: function(str) {
			if (!str) return;
			var self = this, i, fieldName, fieldValue;
			$.each(str.split('&'), function() {
				//I'm not using "this.split('=')" here because the body may have multiple "="s.
				//I could do a split() and then rejoin all but the first element, but this is a little cleaner
				i = this.indexOf('=');
				fieldName = this.slice(0, i);
				fieldValue = decodeURIComponent(this.slice(i + 1));
				if (fieldName === 'id' && self.option('permalinkHandler') !== null) {
					self.option('permalinkHandler').call(self, false, fieldValue, $.proxy(self._unserialize, self));
				} else {
					self.option(fieldName, fieldValue);
				}
			});
		},

		// Serializes the request and response as a string so it can be sent to a server for permalinking
		_serialize: function() {
			var serialized = {
				response: this._lastResponse,
				request: {}
			};

			$.each(this.paramNames, $.proxy(function(i, fieldName) {
				serialized.request[fieldName] = this.getFieldValue(fieldName);
			}, this));

			return JSON.stringify(serialized);
		},

		// Takes in a string returned by _serialize() and restores exploRPC to the state represented by the string
		_unserialize: function(jsonString) {
			var json = JSON.parse(jsonString);

			$.each(json.request, $.proxy(function(fieldName, fieldValue) {
				this.option(fieldName, fieldValue);
			}, this));
			this._lastRequestParams = this._getRequestParams();

			this._lastResponse = json.response;
			this._showResponse(this._lastResponse);
			this.element.find('.explorpc-permalink').addClass('ui-state-disabled');
		},

		getFieldValue: function(fieldName) {
			if (fieldName === 'body') return this._requestBodyEditor.getActualValue();
			else return this.element.find('[name=' + fieldName + ']').val();
		},

		_adjustDimensions: function() {
			var hExpand = this.element.hasClass('explorpc-horizontal-expanded'),
				totalHeight = this.element.height(),
				sectionHeight = (hExpand ? (totalHeight / 2) : totalHeight) - 3,
				// requestBodyHeight = sectionHeight - borders - top margin of request body
				requestBodyHeight = sectionHeight - 2 - 6,
				// responseEditorHeight = sectionHeight - <header> height - .field margins
				responseEditorHeight = sectionHeight - 22 - 18;

			this._responseEditor.setSize(null, responseEditorHeight  + "px");

			// compute request body height by subtracting height of each of its siblings (plus the bottom margin)
			this.element
				.find('.explorpc-body')
				.siblings(':visible:not(.explorpc-h-expand)')
				.each(function(i, element) {
					requestBodyHeight -= ($(element).outerHeight() + 12);
				});
			this._requestBodyEditor.setSize(null, requestBodyHeight + "px");
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
				this._getStatusLine(this._lastResponse) +
				this._lastResponse.headers + "\n" +
				this._escapeHTML(this._lastResponse.body) + 
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
			var lastLineIndex = this._responseEditor.lineCount() - 1,
				lastLine = this._responseEditor.getLine(lastLineIndex),
				range = {
					from: { line: 0, ch: 0 },
					to: { line: lastLineIndex, ch: lastLine.length }
				};
			this._responseEditor.autoFormatRange(range.from, range.to);
			this._responseEditor.setSelection(range.from);
		},

		generatePermanentLink: function() {
			var dialog = this.element.find('.explorpc-dialog'),
				spinner = this.element.find('.explorpc-spinner'),
				successCallback = function(link, linkText) {
					dialog.html("Permanent link:<br><a href=\"" + link + "\">" + linkText + "</a>");
					spinner.hide();
				};

			dialog
				.html("Sending details to server...")
				.dialog({
					'title': 'Permanent link',
					'height': 'auto',
					'position': { my: "center", at: "center", of: this.element },
					'dialogClass': 'explorpc-dialog',
					'close': this._getCloseDialogCallback()
				});

			spinner.show().position({ of: dialog });

			// @todo add an errorCallback
			this.option('permalinkHandler').call(this, true, this._serialize(), successCallback);
		},

		_escapeHTML: function(html) {
			return html
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		},

		// clever little trick to turn a URL into a Location object
		_getLocation: function(href) {
			var l = document.createElement("a");
			l.href = href;
			return l;
		},

		_typeChanged: function(event) {
			var type = this.getFieldValue('type'),
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
			switch (this.getFieldValue('type')) {
				case 'soap11':
				case 'soap12':
					return 'SOAPAction';
				default:
					return 'Method';
			}
		},

		_getRequestBodyHeader: function() {
			switch (this.getFieldValue('type')) {
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
			switch (this.getFieldValue('type')) {
				case 'json-rpc':
					return "[\"Hello JSON-RPC\"]";
				case 'soap11':
				case 'soap12':
					return "<m:alert xmlns:m=\"http://example.org/alert\">\n\t<m:msg>Pickup Mary</m:msg>\n</m:alert>";
				case 'xml-rpc':
					return "<params>\n\t<param><value>foo</value></param>\n\t</params>";
				case 'raw':
					return '';
			}
		},

		getMimeType: function() {
			switch (this.getFieldValue('type')) {
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
			var httpMethod = this.getFieldValue('httpMethod');
			this.element
				.removeClass('explorpc-method-post explorpc-method-put explorpc-method-get explorpc-method-delete explorpc-method-trace')
				.addClass('explorpc-method-' + httpMethod);
		},

		_authChanged: function(event) {
			var auth = this.getFieldValue('auth');
			this.element.toggleClass('explorpc-auth-basic', auth === 'basic');
			this._adjustDimensions();
		},

		_urlChanged: function(event) {
			var url = this.getFieldValue('url');
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
				this.tunnelRequest(this.getFullUrl(), this._doRequest);
			} else {
				this._doRequest($.ajax);
			}
		},

		tunnelRequest: function(url, onSuccess) {
			var loc = this._getLocation(url);
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
					onSuccess.call(this, this._subdomainAjax[loc.host]);
				}
			} else {
				onSuccess.call(this, $.ajax);
			}
		},

		getFullUrl: function() {
			var url = this.getFieldValue('url');
			if (!url.match(/^https?:\/\//)) {
				url = window.location.protocol + '//' + url;
			}
			return url;
		},

		_getRequestParams: function() {
			var params = {};
			params.type = this.getFieldValue('httpMethod').toUpperCase();
			params.url = this.getFullUrl();
			params.dataType = 'text';
			params.timeout = this.option('timeout');
			params.processData = false;
			params.headers = {};

			if (this.getFieldValue('auth') === 'basic') {
				var username = this.getFieldValue('username'),
					password = this.getFieldValue('password');
				params.headers.Authorization = 'Basic ' + window.btoa(username + ":" + password);
			}

			params.contentType = this.getMimeType();
			switch (this.getFieldValue('type')) {
				case 'json-rpc':
					params.data = this._getJsonRPCRequestBody();
					break;
				case 'xml-rpc':
					params.data = this._getXMLRPCRequestBody();
					break;
				case 'soap11':
				case 'soap12':
					params.headers.SOAPAction = this.getFieldValue('method');
					params.data = this._getSoapRequestBody();
					break;
				case 'raw':
					params.data = this.getFieldValue('body');
					break;
			}

			return params;
		},

		_doRequest: function(ajax) {
			this._lastRequestParams = this._getRequestParams();
			ajax(this._lastRequestParams)
				.fail($.proxy(this._requestError, this))
				.done($.proxy(this._requestSuccess, this))
				.always($.proxy(this._requestDone, this));
		},

		_getJsonRPCRequestBody: function() {
			var method = this.getFieldValue('method'),
				params = this.getFieldValue('body'),
				request = '';

			if (!params) params = '[]';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (!this.element.find('[name=notification]:checked').length) {
				// generate a random ID for this request, because using NULL for the ID is discouraged in the spec:
				// "[1] The use of Null as a value for the id member in a Request object is discouraged,
				// because this specification uses a value of Null for Responses with an unknown id.
				// Also, because JSON-RPC 1.0 uses an id value of Null for Notifications this could
				// cause confusion in handling."
				request += ',"id": ' + this._getRandomId();
			}
			return request + '}';
		},

		_getRandomId: function() {
			return Math.floor(Math.random() * 99999);
		},

		_getSoapRequestBody: function() {
			var type = this.getFieldValue('type'),
				request = '<?xml version="1.0" encoding="UTF-8"?>';

			if (type === 'soap11') {
				//based off http://www.w3.org/TR/2000/NOTE-SOAP-20000508/#_Toc478383490
				request += '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
					' soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
			} else {
				// based off http://www.w3.org/TR/soap12-part0/#Example
				request += '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">';
			}
			// @todo Add support for setting SOAP headers
			request += '<soap:Header/>' +
					'<soap:Body>' + this.getFieldValue('body') + '</soap:Body>' +
				'</soap:Envelope>';
			return request;
		},

		_getXMLRPCRequestBody: function() {
			var body = this.getFieldValue('body'),
				method = this.getFieldValue('method'),
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
				.find('.explorpc-dialog')
					.text(errorDesc)
					.dialog({
						'title': 'Request failed',
						'height': 'auto',
						'position': { my: "center", at: "center", of: this.element },
						'dialogClass': 'explorpc-dialog',
						'close': this._getCloseDialogCallback()
					});

			this._responseEditor.setValue('');
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

		_getStatusLine: function(response) {
			return "HTTP/1.1 " + response.status + " " + response.statusText + "\n";
		},

		_requestSuccess: function(data, success, jqXHR) {
			this._lastResponse = {
				headers: jqXHR.getAllResponseHeaders(),
				body: jqXHR.responseText,
				status: jqXHR.status,
				statusText: jqXHR.statusText
			};
			this._showResponse(this._lastResponse);
		},

		_showResponse: function(response) {
			this.element
				.find('.explorpc-viewraw, .explorpc-prettyprint, .explorpc-permalink')
				.removeClass('ui-state-disabled');
			
			this._setResponseMode(this.getMimeType());
			var fullResponse = this._getStatusLine(response) + response.headers + "\n" + response.body;
			this._responseEditor.setValue(fullResponse);

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

		destroy: function () {
			$.Widget.prototype.destroy.call(this);
		}
	});

	$.widget.bridge("explorpc", $.mm.explorpc);
})(jQuery, window, document);
