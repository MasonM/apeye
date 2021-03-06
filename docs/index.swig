{% extends "layout.swig" %}

{% block title %}APEye{% endblock%}

{% block head %}
	<link rel="stylesheet" href="css/prettify.css">
	<link rel="stylesheet" href="css/styles.css">
	<link rel="stylesheet" href="css/smoothness/jquery-ui-1.9.2.custom.min.css">

	<link rel="stylesheet" href="dist/apeye.css">
	<link rel="stylesheet" href="dist/codemirror.css">

	<script src="js/jquery-1.8.3.min.js"></script>
	<script src="js/prettify.js"></script>
	<script src="js/prettify-lang-css.js"></script>
	<script src="js/base64.min.js"></script>
	<script src="js/jquery-ui-1.9.2.custom.min.js"></script>
	<script src="js/jquery.toc.js"></script>

	<script src="dist/codemirror.js"></script>
	<script src="dist/apeye.js"></script>

	<script src="js/apeye-rpc-example.js"></script>
	<script src="js/apeye-rest-example.js"></script>
	<script>
		$(function() {
			$("#toc").toc({
				selectors: "h2,h3",
				smoothScrolling: false,
				anchorName: function(i, heading, prefix) {
					return heading.id;
				}
			});
			$(window).on('hashchange', function() {
				// hack to prevent the top navbar from obscuring the content
				if ($(':target').length) window.scrollBy(0, -45);
			});
			prettyPrint();
		});
	</script>

	<style type="text/css">
		#apeye-rpc-example, #apeye-rest-example {
			width: 580px;
			height: 500px;
			margin: 0 auto;
		}
		#apeye-rpc-example .apeye-id {
			/* Hide the "id" field to keep things simple for the demo. The default of "apeye" is fine. */
			display: none !important;
		}

		#apeye-rest-example {
			display: none;
		}
		#apeye-rest-example .apeye-options, #apeye-rest-example .apeye-h-expand {
			/* Don't show any of the options, because changing from the sample request won't make sense */
			display: none;
		}
	</style>
{% endblock head %}

{% block body %}
	{% include "navbar.swig" %}
	<div class="container">
		<div class="row">
			<div class="span3 tocify">
				<div id="toc"></div>
			</div>
			<div class="span9">
				<div class="overview">
					<h2 id="overview" class="toc-header">Overview</h2>
					<h1>
						Spruce up your API docs with a <br>fully-functional client
					</h1>
					<p>
						APEye is a jQuery widget for issuing HTTP requests, designed to help document and test APIs. With a few lines of Javascript, you can let users experiment with your API without leaving the documentation. Unlike <a href="http://hurl.it">hurl</a> and <a href="http://apigee.com">apigee</a>, requests are handled entirely by the client &ndash; no server-side proxy is needed. Try it out below!
					</p>
					<br>
					<div class="row-fluid">
						<div class="span2">
							<h5>JSON-RPC</h5>
							{% set prefix = "#type=json-rpc&amp;url=api.apeye.org%2Fjson-rpc" %}
							<ul>
								<li><a href='{{prefix}}&amp;method=add&amp;body={% filter url_encode %}[10,20]{% endfilter %}'>10+20</a></li>
								<li><a href='{{prefix}}&amp;method=multiply&amp;body={% filter url_encode %}[10,20]{% endfilter %}'>10*20</a></li>
								<li><a href='{{prefix}}&amp;method=sum&amp;body={% filter url_encode %}[[10,20,30]]{% endfilter %}'>10+20+30</a></li>
								<li><a href='{{prefix}}&amp;method=square&amp;body={% filter url_encode %}[10]{% endfilter %}'>10<sup>2</sup></a></li>
							</ul>

							<h5>SOAP</h5>
							{% set prefix = "#type=soap11&amp;url=api.apeye.org%2Fsoap" %}
							<ul>
								<li><a href='{{prefix}}&amp;method=add&amp;body={% filter url_encode %}<add xlmns="http://api.apeye.org/soap">
	<a>10</a>
	<b>20</b>
</add>{% endfilter %}'>10+20</a></li>
								<li><a href='{{prefix}}&amp;method=multiply&amp;body={% filter url_encode %}<multiply xlmns="http://api.apeye.org/soap">
	<a>10</a>
	<b>20</b>
</multiply>{% endfilter %}'>10*20</a></li>
								<li><a href='{{prefix}}&amp;method=sum&amp;body={% filter url_encode %}<sum xlmns="http://api.apeye.org/soap">
	<a>
		<decimal>10</decimal>
		<decimal>20</decimal>
		<decimal>30</decimal>
	</a>
</sum>{% endfilter %}'>10+20+30</a></li>
								<li><a href='{{prefix}}&amp;method=square&amp;body={% filter url_encode %}<square xlmns="http://api.apeye.org/soap">
	<a>10</a>
</square>{% endfilter %}'>10<sup>2</sup></a></li>
							</ul>

							<h5>XML-RPC</h5>
							{% set prefix = "#type=xml-rpc&amp;url=api.apeye.org%2Fxml-rpc" %}
							<ul>
								<li><a href='{{prefix}}&amp;method=add&amp;body={% filter url_encode %}<params>
	<param><value><int>10</int></value></param>
	<param><value><int>20</int></value></param>
</params>{% endfilter %}'>10+20</a></li>
								<li><a href='{{prefix}}&amp;method=multiply&amp;body={% filter url_encode %}<params>
	<param><value><int>10</int></value></param>
	<param><value><int>20</int></value></param>
</params>{% endfilter %}'>10*20</a></li>
								<li><a href='{{prefix}}&amp;method=sum&amp;body={% filter url_encode %}<params>
	<param>
		<array>
			<data>
				<value><int>10</int></value>
				<value><int>20</int></value>
				<value><int>30</int></value>
			</data>
		</array>
	</param>
</params>{% endfilter %}'>10+20+30</a></li>
								<li><a href='{{prefix}}&amp;method=square&amp;body={% filter url_encode %}<params>
	<param><value><int>10</int></value></param>
</params>{% endfilter %}'>10<sup>2</sup></a></li>
							</ul>
						</div>
						<div class="span10">
							<div id="apeye-rpc-example"></div>
						</div>
					</div>
					<br>
					<p>
						The project is hosted on <a href="http://bitbucket.org" target="_blank" class="projectLinks">Bitbucket</a> and is available for use under the <a href="http://bitbucket.org/MasonM/apeye/src/tip/LICENSE" target="_blank" class="projectLinks">MIT software license</a>. You can report bugs and discuss features on the <a href="http://bitbucket.org/MasonM/apeye/issues" target="_blank">issues page</a>.
					</p>
					<p>
						<a class="btn btn-primary btn-large" href="/customDownload.html" target="_blank">Custom Download&raquo;</a>
						<a class="btn btn-primary btn-large" href="https://bitbucket.org/MasonM/apeye/" target="_blank">Fork on Bitbucket &raquo;</a>
					</p>
				</div>

				<hr/>
				<h2 id="features">Features</h2>
				<ul>
					<li>Tested in Firefox 17+, Chrome 20+, and IE 9</li>
					<li>Supports SOAP 1.1, SOAP 1.2, XML-RPC, and JSON-RPC 2.0</li>
					<li>Powered by <a href="http://codemirror.com">CodeMirror</a>, with automatic syntax highlighing and pretty-printing</li>
					<li><a href="#subdomain-tunneling">Circumvents the same-origin policy for subdomains</a></li>
					<li><a href="#permalinks">Can generate permanent links to snapshot a request and response</a></li>
					<li>Autocompletion support for <a href="#method-autocompletion">method names</a> and <a href="#url-autocompletion">URLs</a></li>
				</ul>

				<hr/>
				<h2 id="examples">Examples</h2>
				<ul class="examples">
					<li>Click the button below to launch a stripped-down APEye console for a <a href="https://bitbucket.org/MasonM/apeye/src/tip/examples/api.apeye.org/example_server/rest.py">simple REST API</a>:
						<br>
						<a id="apeye-launch-rest-example" class="btn btn-info btn-small" href="#">Launch REST Console</a>
						<div id="apeye-rest-example" class="apeye-horizontally-expanded"></div>
					</li>
					<li>To see how APEye might be used with Doxygen, see <a href="doxygen/namespaceexample__server_1_1rest.html">this page</a> for Doxygen-generated documentation for the above REST API.</li>
					<li><a href="http://nutshell.com/api">Nutshell CRM</a> uses APEye throughout the documentation of its RPC-based API. Each method on <a href="https://www.nutshell.com/api/detail/class_core.html">the API reference page</a> has a separate "Try it out!" button that launches an APEye console for that method. </li>
				</ul>

				<hr/>
				<h2 id="getting-started">Getting Started</h2>
				<p>
					Go to the <a href="customDownload.html">Custom Download</a> page to get the minified JS and CSS. To initialize APEye, call the <code>apeye</code> method on a container element (e.g. <code>&lt;div class="apeye-container"&gt;&lt;/div&gt;</code>)
					<pre class="prettyprint">
$('.apeye-container').apeye({
	//options
});</pre>
				</p>

				<h3 id="getting-started-css">CSS</h3>
				<p>
					The only CSS properties that must be defined on the APEye container are <code>height</code> and <code>width</code>
					<pre class="prettyprint lang-css">
.apeye-container {
	height: 400px;
	width: 800px;
}</pre>
				If you wish to hide a field or a drop-down choice, simply set <code>display: none</code> on the CSS class for the field/choice. For example, here's how to hide the "Method" field and the "PUT" option of the HTTP method drop-down:
				<pre class="prettyprint lang-css">
.apeye-container .apeye-method, .apeye-container .method-put {
	display: none;
}</pre>
				</p>

				<hr/>
				<h2 id="options">Options</h2>
				<h3 id="options-overview">Overview</h3>
				<table class="table table-striped table-bordered table-condensed">
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
					<tr>
						<td class="optionName">autocompleteMethodSource</td>
						<td>null | string | array | function</td>
						<td>null</td>
						<td>See <a href="#method-autocompletion">Method Autocompletion</a></td>
					</tr>
					<tr>
						<td class="optionName">autocompleteUrlSource</td>
						<td>null | string | array | function</td>
						<td>null</td>
						<td>See <a href="#url-autocompletion">URL Autocompletion</a></td>
					</tr>
					<tr>
						<td class="optionName">permalinkSender</td>
						<td>null | function</td>
						<td>null</td>
						<td>See <a href="#permalinks">Permanent Links</a></td>
					</tr>
					<tr>
						<td class="optionName">permalinkRetriever</td>
						<td>null | function</td>
						<td>null</td>
						<td>See <a href="#permalinks">Permanent Links</a></td>
					</tr>
					<tr>
						<td class="optionName">indent</td>
						<td>integer</td>
						<td>3</td>
						<td>Indentation used by CodeMirror for the request body.</td>
					</tr>
					<tr>
						<td class="optionName">timeout</td>
						<td>integer</td>
						<td>5000</td>
						<td>Timeout for requests in miliseconds.</td>
					</tr>
					<tr>
						<td class="optionName">autoPrettyPrint</td>
						<td>boolean</td>
						<td>false</td>
						<td>If true, responses will be automatically pretty-printed. If false, a "Pretty Print" button will be shown in the Response header.</td>
					</tr>
					<tr>
						<td class="optionName">subdomainTunneling</td>
						<td>boolean</td>
						<td>false</td>
						<td>See <a href="#subdomain-tunneling">Subdomain Tunneling</a></td>
					</tr>
					<tr>
						<td class="optionName">tunnelFilepath</td>
						<td>string</td>
						<td>"/tunnel.html"</td>
						<td>See <a href="#subdomain-tunneling">Subdomain Tunneling</a></td>
					</tr>
					<tr>
						<td class="optionName">permalinkId</td>
						<td>string</td>
						<td>null</td>
						<td>See <a href="#permalinks">Permanent Links</a></td>
					</tr>
					<tr>
						<td class="optionName">type</td>
						<td>string</td>
						<td>"raw"</td>
						<td>Setter for the "Type" field. Possible values: raw, json-rpc, xml-rpc, soap11, soap12</td>
					</tr>
					<tr>
						<td class="optionName">httpMethod</td>
						<td>string</td>
						<td>"post"</td>
						<td>Setter for the "HTTP Method" field. Possible values: post, get, put, delete, trace</td>
					</tr>
					<tr>
						<td class="optionName">auth</td>
						<td>string</td>
						<td>"none"</td>
						<td>Setter for the "Auth" field. Possible values: none, basic</td>
					</tr>
					<tr>
						<td class="optionName">url</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the "URL" field</td>
					</tr>
					<tr>
						<td class="optionName">method</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the "Method" field (only shown if type != "raw")</td>
					</tr>
					<tr>
						<td class="optionName">username</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the "Username" field (only shown if auth="basic")</td>
					</tr>
					<tr>
						<td class="optionName">password</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the "Password" field (only shown if auth="basic")</td>
					</tr>
					<tr>
						<td class="optionName">id</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the "Id" field (only shown if type="json-rpc")</td>
					</tr>
					<tr>
						<td class="optionName">body</td>
						<td>string</td>
						<td>""</td>
						<td>Setter for the request body (only shown if httpMethod = "post" or "put")</td>
					</tr>
				</table>

				<h3 id="method-autocompletion">Method Autocompletion</h3>
				<p>
					When method autocompletion is enabled via "autocompleteMethodSource", the "Method" field will be turned into a find-as-you-type search box,
					and a small arrow will be added to allow viewing all methods.
					<br/><br/>
					The "autocompleteMethodSource" option accepts the same values as the <a href="http://api.jqueryui.com/autocomplete/#option-source">JQuery UI "source" option</a>, with one additional feature: if given a string representing a URL to a WSDL file, the file will be immediately requested and parsed, and the autocomplete list will contain the name attributes of each &lt;wsdl:operation&gt; tag contained in it. The example at the top of this page uses this feature with the WSDL file at <a href="http://api.apeye.org/soap?wsdl">http://api.apeye.org/soap?wsdl</a>.
				</p>

				<h3 id="url-autocompletion">URL Autocompletion</h3>
				<p>
					As with method autocompletion, using the "autocompleteUrlSource" option will turn the "URL" field into a find-as-you-type search box. The "autocompleteUrlSource" option accepts the same values as the <a href="http://api.jqueryui.com/autocomplete/#option-source">JQuery UI "source" option</a>.
					<br/><br/>
					If your API is REST-based, you can have APEye automatically add fields based on parameter names in the URL by enclosing them in angle brackets. For example, if you have the URL "http://example.com/book/&lt;bookId&gt;/foo", a field will be added under the "Request" section with the label "bookId".
				</p>

				<h3 id="subdomain-tunneling">Subdomain Tunneling</h3>
				<p>
				If your API endpoint is on a different subdomain as your documentation site, APEye will let you circumvent the same-origin policy by tunneling requests through an iframe. Enabling tunneling is a 3 step processs:
				<ol>
					<li>
						On the documentation site, add a line of Javascript to set <code>document.domain</code> to a domain suffix shared by both it and the API endpoint. For example, the demo at the top of this page communicates with "api.apeye.org", which shares the "apeye.org" suffix:
						<pre class="prettyprint">document.domain = 'apeye.org';</pre>
					</li>
					<li>
						Upload a small HTML file to the subdomain that does 2 things: include jQuery and set <code>document.domain</code> to the suffix as above. For example:
						<pre class="prettyprint">
&lt;html&gt;
&lt;head&gt;
	&lt;script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js"&gt;&lt;/script&gt;
	&lt;script&gt;document.domain = 'apeye.org';&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;&lt;/body&gt;
&lt;/html&gt;</pre>
					</li>
					<li>
						When initializing APEye, set the <code>subdomainTunneling</code> option to <code>true</code>
				</ol>
				</p>

				<h3 id="permalinks">Permanent Links</h3>
				<p>
				APEye has the ability to serialize the current request and response into a JSON string, and to deserialize such a string to restore all fields to the state represented therein. The <code>permalinkSender</code>, <code>permalinkRetriever</code> and <code>permalinkId</code> options are what facilitate this:
				<ul>
					<li>The <code>permalinkSender</code> option should be set to a function with the prototype <code>function(jsonData, successCallback)</code> that sends the given jsonData string to an external server (e.g. a pastebin) for storage, and calls <code>successCallback</code> on success with a unique link. This function will be called when the "Link" button, which is only shown if permalinkSender is non-null, is clicked.
					<li>The <code>permalinkRetriever</code> option should be set to a function with the prototype <code>function(permalinkId, successCallback)</code> that will retrieve the JSON string corresponding to the given permalinkId from the external server, and calls <code>successCallback</code> with that string on success. This function will be called when the <code>permalinkId</code> option is set. 
				</ul>
				The example at the top of this page uses this feature with a <a href="http://bitbucket.org/MasonM/apeye/src/tip/examples/api.apeye.org/example_server/pastebin.py">simple MySQL-backed pastebin</a>. See the <a href="http://bitbucket.org/MasonM/apeye/src/tip/docs/js/apeye-rpc-example.js">apeye-rpc-example.js file</a> for the annotated code.
				</p>
			</div>
		</div>
	</div>
{% endblock body %}
