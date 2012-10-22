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
			timeout: 5 * 1000,
			subdomainTunneling: false
		},
		_bodyEditor: null,
		_lastResponse: null,
		_lastRequestParams: null,
		_initialized: false,
		_subdomainAjax: {},

		_create: function() {
			var self = this;
			$.each(this.paramNames, function(i, fieldName) {
				self.element.find('[name=' + fieldName + ']').val(self.option(fieldName));
			});

			this._initRequestBody();

			this.element
				.resizable({ handles: 'se', }).find('.ui-resizable-se').addClass('ui-icon-grip-diagonal-se').end()
				.resize($.proxy(this._adjustDimensions, this))
				.delegate('[name=type]', 'change', $.proxy(this._typeChanged, this))
				.delegate('[name=httpMethod]', 'change', $.proxy(this._httpMethodChanged, this))
				.delegate('[name=auth]', 'change', $.proxy(this._authChanged, this))
				.delegate('[name=request]:not(.ui-state-disabled)', 'click', $.proxy(this._requestClicked, this))
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
				//highlight active line
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
				.removeClass('explorpc-json-rpc explorpc-soap11 explorpc-soap12 explorpc-raw')
				.addClass('explorpc-' + type);

			if (type === 'json-rpc' || type === 'soap11' || type === 'soap12') {
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
					placeholders['method'] = "Method name";
					placeholders['body'] = "[\"Hello JSON-RPC\"]";
					break;
				case 'soap11':
				case 'soap12':
					placeholders['method'] = "SOAPAction header";
					placeholders['body'] = "<m:alert xmlns:m=\"http://example.org/alert\">\n\t<m:msg>Pickup Mary</m:msg>\n</m:alert>";
					break;
				case 'xml-rpc':
					placeholders['method'] = "Method name";
					placeholders['body'] = "<params>\n\t<param><value>foo</value></param>\n\t</params>";
				case 'raw':
				default:
			}

			$.each(placeholders, $.proxy(function(name, placeholderString) {
				this.element.find('[name=' + name + ']').attr('placeholder', placeholderString);
			}, this));

			// set placeholder text
			this._bodyEditor.setValueToPlaceholder(this._bodyEditor);
		},

		getMimeType: function() {
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					return 'application/json';
				case 'soap11':
				case 'soap12':
				case 'xml-rpc':
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

		_requestClicked: function(event) {
			var responseSection = this.element.find('.explorpc-response');
			this.element
				.find('[name=request]').addClass('ui-state-disabled').end()
				.find('.explorpc-spinner').show().position({ of: responseSection });
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
			if (loc.host !== window.location.host && loc.host.match(document.domain + "$")) {
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
				params.headers['Authorization'] = 'Basic ' + window.btoa(username + ":" + password);
			}

			params.contentType = this.getMimeType();
			switch (this.element.find('[name=type]').val()) {
				case 'json-rpc':
					params.data = this._getJsonRPCRequestBody();
					break;
				case 'soap11':
				case 'soap12':
					params.headers["SOAPAction"] = this.element.find('[name=method]').val();
					params.data = this._getSoapRequestBody();
					break;
				case 'raw':
					params.data = this._bodyEditor.getValue();
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
			var body = this._bodyEditor.getValue(),
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

		_requestSuccess: function(data, success, jqXHR) {
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

		_requestDone: function() {
			this.element
				.find('[name=request]').removeClass('ui-state-disabled').end()
				.find('.explorpc-response').fadeTo(0, 1).end()
				.find('.explorpc-spinner').hide();
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
