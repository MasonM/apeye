{% extends "layout.swig" %}

{% block title %}APEye - Standalone RPC Example{% endblock%}

{% block head %}
	<link rel="stylesheet" href="css/styles.css">
	<link rel="stylesheet" href="css/smoothness/jquery-ui-1.9.2.custom.min.css">

	<link rel="stylesheet" href="dist/apeye.css">
	<link rel="stylesheet" href="dist/codemirror.css">

	<script src="js/jquery-1.8.3.min.js"></script>
	<script src="js/base64.min.js"></script>
	<script src="js/jquery-ui-1.9.2.custom.min.js"></script>

	<script src="dist/codemirror.js"></script>
	<script src="dist/apeye.js"></script>

	<script src="js/apeye-rpc-example.js"></script>
	<style type="text/css">
		.apeye {
			width: 700px;
			height: 500px;
			margin: 0 auto;
		}
		.apeye .apeye-id {
			/* Hide the "id" field to keep things simple for the demo. The default of "apeye" is fine. */
			display: none !important;
		}
	</style>
{% endblock head %}

{% block body %}
	{% include "navbar.swig" %}
	<div class="container">
		<div class="row">
			<div class="span3">
				<h3>Examples</h3>

				<h4>JSON-RPC 2.0</h4>
				{% set prefix = "#type=json-rpc&url=api.apeye.org%2Fjson-rpc" %}
				<ul>
					<li><a href='{{prefix}}&method=add&body={% filter url_encode %}[10,20]{% endfilter %}'>10+20</a></li>
					<li><a href='{{prefix}}&method=multiply&body={% filter url_encode %}[10,20]{% endfilter %}'>10*20</a></li>
					<li><a href='{{prefix}}&method=sum&body={% filter url_encode %}[[10,20,30]]{% endfilter %}'>&#931;{10,20,30}</a></li>
					<li><a href='{{prefix}}&method=square&body={% filter url_encode %}[10]{% endfilter %}'>10<sup>2</sup></a></li>
				</ul>

				<h4>SOAP 1.1</h4>
				{% set prefix = "#type=soap11&url=api.apeye.org%2Fsoap" %}
				<ul>
					<li><a href='{{prefix}}&method=add&body={% filter url_encode %}<add xlmns="http://api.apeye.org/soap">
	<a>10</a>
	<b>20</b>
</add>{% endfilter %}'>10+20</a></li>
					<li><a href='{{prefix}}&method=multiply&body={% filter url_encode %}<multiply xlmns="http://api.apeye.org/soap">
	<a>10</a>
	<b>20</b>
</multiply>{% endfilter %}'>10*20</a></li>
					<li><a href='{{prefix}}&method=sum&body={% filter url_encode %}<sum xlmns="http://api.apeye.org/soap">
	<a>
		<decimal>10</decimal>
		<decimal>20</decimal>
		<decimal>30</decimal>
	</a>
</sum>{% endfilter %}'>&#931;{10,20,30}</a></li>
					<li><a href='{{prefix}}&method=square&body={% filter url_encode %}<square xlmns="http://api.apeye.org/soap">
	<a>10</a>
</square>{% endfilter %}'>10<sup>2</sup></a></li>
				</ul>

				<h4>XML-RPC</h4>
				{% set prefix = "#type=xml-rpc&url=api.apeye.org%2Fxml-rpc" %}
				<ul>
					<li><a href='{{prefix}}&method=add&body={% filter url_encode %}<params>
   <param><value><int>10</int></value></param>
   <param><value><int>20</int></value></param>
</params>{% endfilter %}'>10+20</a></li>
					<li><a href='{{prefix}}&method=multiply&body={% filter url_encode %}<params>
   <param><value><int>10</int></value></param>
   <param><value><int>20</int></value></param>
</params>{% endfilter %}'>10*20</a></li>
					<li><a href='{{prefix}}&method=sum&body={% filter url_encode %}<params>
   <param>
		<array>
			<data>
				<value><int>10</int></value>
				<value><int>20</int></value>
				<value><int>30</int></value>
			</data>
		</array>
	</param>
</params>{% endfilter %}'>&#931;{10,20,30}</a></li>
					<li><a href='{{prefix}}&method=square&body={% filter url_encode %}<params>
   <param><value><int>10</int></value></param>
</params>{% endfilter %}'>10<sup>2</sup></a></li>
				</ul>
			</div>
			<div class="span9">
				<div id="apeye-rpc-example"></div>
			</div>
		</div>
	</div>
{% endblock body %}
