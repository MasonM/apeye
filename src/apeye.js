;(function ($, window, document) {
	"use strict";
	$.widget("mm.apeye", {
		html:
		'<section class="apeye-request ui-widget ui-widget-content ui-corner-left">'+
			'<header class="ui-widget-header">'+
				'<h4>Request</h4>' +
			'</header>' +
			'<div class="apeye-row-container apeye-options">' +
				'<div class="apeye-row">' +
					'<span>Options</span>' +
					'<select name="type">' +
						'<option class="type-raw" value="raw">Raw</option>' +
						'<option class="type-json-rpc" value="json-rpc">JSON-RPC</option>' +
						'<option class="type-xml-rpc" value="xml-rpc">XML-RPC</option>' +
						'<option class="type-soap11" value="soap11">SOAP 1.1</option>' +
						'<option class="type-soap12" value="soap12">SOAP 1.2</option>' +
					'</select>' +

					'<select name="httpMethod">' +
						'<option class="method-post" value="post">POST</option>' +
						'<option class="method-get" value="get">GET</option>' +
						'<option class="method-put" value="put">PUT</option>' +
						'<option class="method-delete" value="delete">DELETE</option>' +
						'<option class="method-trace" value="trace">TRACE</option>' +
					'</select>' +

					'<select name="auth">' +
						'<option value="none">No auth</option>' +
						'<option value="basic">Basic</option>' +
					'</select>' +
				'</div>' +
			'</div>' +

			'<div class="apeye-row-container apeye-field apeye-url">' +
				'<label class="apeye-row">' +
					'<span>URL</span>' +
					'<input type="text" name="url" placeholder="api.example.com/endpoint"/>' +
					'<a class="apeye-combobox-toggle ui-corner-right"></a>' +
				'</label>' +
			'</div>' +

			'<div class="apeye-row-container apeye-field apeye-auth">' +
				'<div class="apeye-row">' +
					'<span>Auth</span>' +
					'<input type="text" name="username" placeholder="Username"/>' +
					'<input type="text" name="password" placeholder="Password"/>' +
				'</div>' +
			'</div>' +

			'<div class="apeye-row-container apeye-field apeye-method">' +
				'<label class="apeye-row">' +
					'<span>Method</span>' +
					'<input type="text" name="method" placeholder="method_name"/>' +
					'<a class="apeye-combobox-toggle ui-corner-right"></a>' +
				'</label>' +
			'</div>' +

			'<div class="apeye-row-container apeye-field apeye-id">' +
				'<label class="apeye-row">' +
					'<span>Id</span>' +
					'<input type="text" name="id"/>' +
				'</label>' +
			'</div>' +

			'<h4 class="apeye-subheader apeye-request-body-header">Request body</h4>' +
			'<div class="apeye-row-container apeye-body">' +
				'<textarea name="body"></textarea>' +
			'</div>' +

			'<div class="apeye-row-container apeye-send">' +
				'<button name="request">Send</button>' +
			'</div>' +

			'<div class="ui-widget-header ui-corner-all apeye-h-expand">' +
				'<span class="ui-icon ui-icon-triangle-1-e"></span>' +
			'</div>' +
		'</section>' +

		'<section class="apeye-response ui-widget ui-widget-content ui-corner-right">' +
			'<header class="ui-widget-header">' +
				'<h4>Response</h4>' +
				'<div class="icons">' +
					'<button class="apeye-prettyprint" title="Pretty print response">' +
						'Prty Print' +
					'</button>' +
					'<button class="apeye-permalink" title="Create permanent link">' +
						'Link' +
					'</button>' +
					'<button class="apeye-viewraw" title="View raw request and response">' +
						'Raw' +
					'</button>' +
				'</div>' +
			'</header>' +
			'<div class="apeye-row-container cm-s-default">' +
				'<textarea name="response"></textarea>' +
			'</div>' +
		'</section>' +
		'<div class="apeye-dialog"></div>' +
		'<div class="apeye-spinner"></div>',
		options: {
			// FIELD SETTERS
			type: "raw",
			httpMethod: "post",
			auth: "none",
			url: "",
			method: "",
			username: "",
			password: "",
			id: "apeye",
			body: "",

			// MISC OPTIONS
			autocompleteMethodSource: null,
			autocompleteUrlSource: null,
			permalinkRetriever: null,
			permalinkSender: null,
			indent: 3,
			timeout: 5 * 1000,
			autoPrettyPrint: false,
			subdomainTunneling: false,
			tunnelFilepath: "/tunnel.html"
		},
		// field names
		paramNames: ['type', 'httpMethod', 'auth', 'url', 'method', 'body', 'username', 'password', 'id'],
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
		_urlParamFieldTemplate: '<div class="apeye-row-container apeye-field apeye-url-param-field">' +
			'<label class="apeye-row">' +
				'<span></span>' +
				'<input type="text"/>' +
			'</label>' +
		'</div>',

		_create: function() {
			// inject HTML
			this.element.addClass('apeye').html(this.html);

			// initialize CodeMirror instances
			this._initRequestBody();
			this._initResponse();

			// initialize elements
			this.element
				.toggleClass('apeye-autoprettyprint', this.option('autoPrettyPrint'))
				.toggleClass('apeye-canpermalink', this.option('permalinkSender') !== null)
				.resizable({ handles: 'se' })
				// I want the bigger grip icon (default is too small)
				.find('.ui-resizable-se').addClass('ui-icon-grip-diagonal-se');
			this._initButtons();
			this._initMethodAutocomplete();
			this._initUrlAutocomplete();

			// register events
			this.element
				.resize($.proxy(this._adjustDimensions, this))
				.on('change', '[name=type]', $.proxy(this._typeChanged, this))
				.on('change', '[name=httpMethod]', $.proxy(this._httpMethodChanged, this))
				.on('change', '[name=auth]', $.proxy(this._authChanged, this))
				.on('autocompletechange change', '[name=url]', $.proxy(this._urlChanged, this))
				.on('click', '[name=request]:not(.ui-state-disabled)', $.proxy(this._requestClicked, this))
				.on('click', '.apeye-h-expand', $.proxy(this.toggleHorizontalExpand, this))
				.on('click', '.apeye-viewraw:not(.ui-state-disabled)', $.proxy(this.viewRaw, this))
				.on('click', '.apeye-prettyprint:not(.ui-state-disabled)', $.proxy(this.prettyPrintResponse, this))
				.on('click', '.apeye-permalink:not(.ui-state-disabled)', $.proxy(this.generatePermanentLink, this))
				.on('click', '.apeye-combobox-toggle', $.proxy(this._comboboxToggleClicked, this));
			
			this._initFields();
			if (this._isHorizontallyExpanded()) {
				this._horizontalExpandChanged(); // this calls _adjustDimensions() at the end
			} else this._adjustDimensions();
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
					wrapper.className = wrapper.className.replace('apeye-empty', '');
				} else {
					wrapper.className += ' apeye-empty';	
				}
			};

			this._requestBodyEditor.hasEmptyFlag = function() {
				return this.getWrapperElement().className.indexOf('apeye-empty') !== -1;
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
			CodeMirror.defineMode("apeyeResponse", function(config) {
				return CodeMirror.multiplexingMode(
					CodeMirror.getMode(config, "message/http"), {
						open: "\n",
						// seems CodeMirror requires "close", even though we'll never need it
						close: "\0",
						mode: CodeMirror.getMode(config, innerMode)
					}
				);
			});
			this._responseEditor.setOption('mode', 'apeyeResponse');
		},

		_initFields: function() {
			$.each(this.paramNames, $.proxy(function(i, fieldName) {
				this._setField(fieldName, this.option(fieldName));
			}, this));
		},

		_initButtons: function() {
			this.element.find('[name=request]').button({ disabled: true });
			this.element.find('.apeye-prettyprint').button({
				disabled: true,
				icons: { primary: 'ui-icon-document' }
			});
			this.element.find('.apeye-permalink').button({
				disabled: true,
				icons: { primary: 'ui-icon-link' }
			});
			this.element.find('.apeye-viewraw').button({
				disabled: true,
				icons: { primary: 'ui-icon-clipboard' }
			});
		},

		_initAutocomplete: function(inputField) {
			inputField.autocomplete({
				appendTo: inputField.parent(),
				minLength: 0
			}).focus(function() {
				// show autocomplete list when input is focused
				if (this.value === "") $(this).trigger('keydown.autocomplete');
			});

			// turn the <a> element into a toggle button for the autocomplete list
			inputField.siblings('.apeye-combobox-toggle').button({
				icons: { primary: "ui-icon-triangle-1-s" },
				text: false
			}).removeClass("ui-corner-all").show();
		},

		_initUrlAutocomplete: function() {
			var source = this.option('autocompleteUrlSource'),
				url = this.element.find('[name=url]');
			if (!source) return;

			this._initAutocomplete(url);
			url.autocomplete('option', 'source', source);
		},

		_initMethodAutocomplete: function() {
			var source = this.option('autocompleteMethodSource'),
				method = this.element.find('[name=method]');
			if (!source) return;

			this._initAutocomplete(method);
			if (typeof source === "string") {
				// treat the source as WSDL file that must be requested and parsed
				method.autocomplete('disable'); // disable until we complete parsing the WSDL
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

		_comboboxToggleClicked: function(event) {
			var field = $(event.target).closest('.apeye-row').find('input');
			// close if already visible
			if (field.autocomplete('widget').is(':visible')) {
				field.autocomplete('close');
			} else {
				field.autocomplete('search', '');
			}
		},

		_initAutocompleteWsdl: function(ajax) {
			var self = this;
			ajax({
				url: this.option('autocompleteMethodSource'),
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
			if (key === 'permalinkId') {
				// This isn't really an option (or rather it's a write-only option),
				// but we treat it as one for consistency and simplicity
				if (this.option('permalinkRetriever') === null) return;
				this.element.fadeTo(0, 0.5);
				this.element.find('.apeye-spinner').show().position({ of: this.element });
				this.option('permalinkRetriever').call(this, value, $.proxy(this._unserialize, this));
				return;
			}
			$.Widget.prototype._setOption.apply(this, arguments);
			if ($.inArray(key, this.paramNames) !== -1) {
				this._setField(key, value);
			} else if (key === 'autoPrettyPrint') {
				this.element.toggleClass('apeye-autoprettyprint', value);
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
				self.option(fieldName, fieldValue);
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

		// Takes in a string returned by _serialize() and restores APEye to the state represented by the string
		_unserialize: function(jsonString) {
			var json = JSON.parse(jsonString);

			$.each(json.request, $.proxy(function(fieldName, fieldValue) {
				this.option(fieldName, fieldValue);
			}, this));
			this._lastRequestParams = this._getRequestParams();

			this._lastResponse = json.response;
			this._showResponse(this._lastResponse);
			this.element.fadeTo(0, 1);
			this.element.find('.apeye-permalink').button('enable');
			this.element.find('.apeye-spinner').hide();
		},

		getFieldValue: function(fieldName) {
			if (fieldName === 'body') return this._requestBodyEditor.getActualValue();
			else return this.element.find('[name=' + fieldName + ']').val();
		},

		_adjustDimensions: function() {
			var hExpand = this._isHorizontallyExpanded(),
				totalHeight = this.element.height(),
				sectionHeight = (hExpand ? (totalHeight / 2) : totalHeight) - 3,
				// requestBodyHeight = sectionHeight - borders - top margin of request body
				requestBodyHeight = sectionHeight - 2 - 6,
				autocompleteMaxHeight,
				// responseEditorHeight = sectionHeight - <header> height - .field margins
				responseEditorHeight = sectionHeight - 27 - 24;

			// compute request body height by subtracting height of each of its siblings (plus the bottom margin)
			this.element
				.find('.apeye-body')
				.siblings(':visible:not(.apeye-h-expand)')
				.each(function(i, element) {
					requestBodyHeight -= ($(element).outerHeight() + 12);
				});
			this._requestBodyEditor.setSize(null, requestBodyHeight + "px");

			if (!this.element.find('.apeye-body').is(':visible') && hExpand) {
				// If the request body is hidden, that means "HTTP Method" isn't set to "POST" or "PUT".
				// In that case, we need the response body to take up the height that the request body
				// would've taken if we're horizontally expanded
				responseEditorHeight += requestBodyHeight + 12;
			}
			this._responseEditor.setSize(null, responseEditorHeight  + "px");

			// the autocomplete drop-down is right above the request body
			autocompleteMaxHeight = requestBodyHeight + 12;
			this.element.find('.ui-autocomplete').css('max-height', autocompleteMaxHeight + 'px');
		},

		_isHorizontallyExpanded: function() {
			return this.element.hasClass('apeye-horizontally-expanded');
		},

		toggleHorizontalExpand: function() {
			this.element.toggleClass('apeye-horizontally-expanded');
			this.element.height(this.element.height() * (this._isHorizontallyExpanded() ? 2 : 0.5));
			this._horizontalExpandChanged();
		},

		_horizontalExpandChanged: function() {
			var isExpanded = this._isHorizontallyExpanded();
			// move icons to request section if horizontally expanded so the icons are visible without scrolling
			this.element
				.find('.icons')
				.appendTo(this.element.find('.apeye-' + (isExpanded ? 'request' : 'response') + ' header'));

			// update triangle to point the opposite direction
			this.element
				.find('.apeye-h-expand span')
				.removeClass('ui-icon-triangle-1-e ui-icon-triangle-1-w')
				.addClass(function() {
					return 'ui-icon-triangle-1-' + (isExpanded ? 'w' : 'e');
				});

			this.element
				.find('.apeye-request')
					.removeClass('ui-corner-left ui-corner-top')
					.addClass('ui-corner-' + (isExpanded ? 'top' : 'left'))
					.end()
				.find('.apeye-response')
					.removeClass('ui-corner-right ui-corner-bottom')
					.addClass('ui-corner-' + (isExpanded ? 'bottom' : 'right'));

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
				.find('.apeye-dialog')
				.html(html)
				.dialog({
					'title': 'Raw request and response',
					'height': 'auto',
					'position': { my: "top", at: "top", of: this.element },
					'dialogClass': 'apeye-dialog',
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
			var dialog = this.element.find('.apeye-dialog'),
				spinner = this.element.find('.apeye-spinner'),
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
					'dialogClass': 'apeye-dialog',
					'close': this._getCloseDialogCallback()
				});

			spinner.show().position({ of: dialog });

			// @todo add an errorCallback
			this.option('permalinkSender').call(this, this._serialize(), successCallback);
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

		_typeChanged: function() {
			var type = this.getFieldValue('type'),
				httpMethodSelect = this.element.find('[name=httpMethod]');

			this.element
				.removeClass('apeye-json-rpc apeye-soap11 apeye-soap12 apeye-xml-rpc apeye-raw')
				.addClass('apeye-' + type);

			if (type === 'json-rpc' || type === 'soap11' || type === 'soap12' || type === 'xml-rpc') {
				httpMethodSelect.val('post').attr('disabled', true);
				this._httpMethodChanged();
			} else {
				httpMethodSelect.removeAttr('disabled');
			}

			this._requestBodyEditor.setOption('mode', this.getMimeType());
			this._adjustDimensions();

			this.element.find('.apeye-request-body-header').text(this._getRequestBodyHeader());
			this.element.find('.apeye-method span').text(this._getMethodLabel());
			this.element.find('[name=body]').attr('placeholder', this._getRequestBodyPlaceholder());

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
					return this._lastResponse ? this._lastResponse.contentType : 'text/plain';
			}
		},

		_httpMethodChanged: function() {
			var httpMethod = this.getFieldValue('httpMethod');
			this.element
				.removeClass('apeye-method-post apeye-method-put apeye-method-get apeye-method-delete apeye-method-trace')
				.addClass('apeye-method-' + httpMethod);
			this._adjustDimensions();
		},

		_authChanged: function() {
			var auth = this.getFieldValue('auth');
			this.element.toggleClass('apeye-auth-basic', auth === 'basic');
			this._adjustDimensions();
		},

		_urlChanged: function() {
			var url = this.getFieldValue('url');
			this.element
				.find('[name=request]')
				.button((url.length === 0) ? 'disable' : 'enable');
			this._createFieldsFromUrlParams();
		},

		_getParamsFromUrl: function() {
			var regex = new RegExp(/<([^>]*)>/g), 
				params = [],
				match;
			while ((match = regex.exec(this.getFieldValue('url'))) !== null) {
				params.push(match[1]);
			}
			return params;
		},

		_createFieldsFromUrlParams: function() {
			var existingParamFields = this.element.find('.apeye-request .apeye-url-param-field'),
				requestBodyHeader = this.element.find('.apeye-request-body-header'),
				template = $(this._urlParamFieldTemplate),
				existingField;

			existingParamFields.detach();
			$.each(this._getParamsFromUrl(), function(i, paramName) {
				existingField = existingParamFields.find('[data-fieldName=' + paramName + ']');
				if (existingField.length) {
					existingField.insertBefore(requestBodyHeader);
				} else {
					template.clone()	
						.insertBefore(requestBodyHeader)
						.attr('data-fieldName', paramName)
						.find('span').text(paramName).end()
						.find('input').attr('name', paramName);
				}
			});
			existingParamFields = null;
		},

		_requestClicked: function() {
			var responseSection = this.element.find('.apeye-response');

			this.element.find('[name=request]').button('disable');
			this.element.find('.apeye-spinner').show().position({ of: responseSection });

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
			var url = this.getFieldValue('url'), paramValue, self = this;
			if (!url.match(/^https?:\/\//)) {
				url = window.location.protocol + '//' + url;
			}
			$.each(this._getParamsFromUrl(), function(i, paramName) {
				paramValue = self.element.find('.apeye-url-param-field[data-fieldName="' + paramName + '"] input').val();
				url = url.replace(new RegExp("<" + paramName + ">"), paramValue);
			});
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
				id = this.getFieldValue('id'),
				request = '';

			if (!params) params = '[]';
			request = '{"jsonrpc":"2.0","method":"' + method + '","params":' + params;
			if (id.length) request += ',"id": "' + id + '"';
			return request + '}';
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
				.find('.apeye-dialog')
					.text(errorDesc)
					.dialog({
						'title': 'Request failed',
						'height': 'auto',
						'position': { my: "center", at: "center", of: this.element },
						'dialogClass': 'apeye-dialog',
						'close': this._getCloseDialogCallback()
					});

			this._responseEditor.setValue('');
		},

		_getCloseDialogCallback: function() {
			// workaround for jQuery bug: http://bugs.jqueryui.com/ticket/5762
			var dialogElem = this.element.find('.apeye-dialog'),
				element = this.element;
			return function () {
				dialogElem.dialog('destroy');
				dialogElem.appendTo(element);
				element.find('.apeye-spinner').hide();
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
				statusText: jqXHR.statusText,
				contentType: jqXHR.getResponseHeader('Content-Type')
			};
			this._showResponse(this._lastResponse);
		},

		_showResponse: function(response) {
			this.element
				.find('.apeye-viewraw, .apeye-prettyprint, .apeye-permalink')
				.button('enable');
			
			this._setResponseMode(this.getMimeType());
			var fullResponse = this._getStatusLine(response) + response.headers + "\n" + response.body;
			this._responseEditor.setValue(fullResponse);

			if (this.option('autoPrettyPrint')) {
				this.prettyPrintResponse();
			}
		},

		_requestDone: function() {
			this.element.find('[name=request]').button('enable');
			this.element.find('.apeye-response').fadeTo(0, 1);
			this.element.find('.apeye-spinner').hide();
		},

		destroy: function () {
			$.Widget.prototype.destroy.call(this);
		}
	});

	$.widget.bridge("apeye", $.mm.apeye);
})(jQuery, window, document);
