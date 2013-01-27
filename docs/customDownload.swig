{% extends "layout.swig" %}

{% block title %}APEye - Custom Download{% endblock%}

{% block head %}
	<link rel="stylesheet" href="css/styles.css">

	<script src="js/jquery-1.8.3.min.js"></script>
	<script src="js/base64.min.js"></script>
	<script src="js/DownloadBuilder.js"></script>
	<script>
		$(function() {
			$("a[href='#']").click(function(event) {
				event.preventDefault();
			});

			var builder = new DownloadBuilder();
			$("#css-generate").on("click", function() {
				builder.buildURL($("#css-downloads input[type='checkbox']:checked"), "apeye.css", "css", function(data) {
					$("#generated-css-source").text(data.content);

					if(!data.content) {
						$("#css-download").fadeOut("slow");
					}

					if(data.url) {
						$("#css-download").attr("href", data.url).fadeIn("slow");
					}
				});
			});

			$("#javascript-generate").on("click", function() {
				builder.buildURL($("#javascript-downloads input[type='checkbox']:checked"), "apeye.js", "javascript", function(data) {
					$("#generated-javascript-source").text(data.content);

					if(!data.content) {
						$("#javascript-download").fadeOut("slow");
					}

					if(data.url) {
						$("#javascript-download").attr("href", data.url).fadeIn("slow");
					}
				});
			});
		});
	</script>
{% endblock head %}

{% block body %}
	{% include "navbar.swig" %}
	<div class="container">
		<header class="jumbotron subhead" id="overview">
			<h1>Customize and download</h1>
			<p class="lead">
				Customize your APEye build by selecting only the components that you need.
			</p>
		</header>

		<section class="custom-downloads" id="css-downloads">
			<div class="page-header">
				<h1>
					1. Choose CSS components
					<small>Get just the CSS you need</small>
				</h1>
			</div>
			<div class="row">
				<div class="span3">
					<label class="checkbox">
						<input checked="checked" disabled type="checkbox" value="dist/apeye.css" title="apeye.css"> APEye CSS
					</label>
				</div>
				<div class="span3">
					<label class="checkbox">
						<input checked="checked" type="checkbox" value="dist/codemirror.css" title="codemirror.css"> CodeMirror CSS
					</label>
				</div>
				<div class="span3">
					<label class="checkbox">
						<input type="checkbox" value="css/smoothness/jquery-ui-1.9.2.custom.min.css" title="jquery-ui-1.9.2.custom.min.css"><a href="http://jqueryui.com/download/#!version=1.9.2&amp;zThemeParams=5d000001001806000000000000003d8888d844329a8dfe02723de3e5701fa198449035fc0613ff729a37dd818cf92b1f6938fefa90282d04ae436bb72367f5909357c629e832248af2c086db4ab730aa4cced933a88449eca61db9f7f3b23d47f58a712d809b6088edfb3e1ab0fd4487a569ff42031bb6d7a49d18146438720e2922c0f24a3d6770a0e3c3ef962059bf3ee661385162d846b90056334d427542680533f2eec42e7eef203c816cb3cb607201aaab3b6a220c6c180c92127dbbce92280981672cb9c0efc2eaed6c7f5489b10e97ca8f316cf9caf4d9239a49c36530395fa10fb17f936a1ae1227004846fafaee5cb24c330d5df5f0f921b66345ddab110e84fffd6b755d1553edaa368f05d14090657cd63ec60bd334fc9adbb4993fcabad6e81a01607e3207a4a68045c066dcf91674fe7fa87ed2083c180447470598cc1727f0c18602ba22470972009f124bebe34551e6f63bce28f0a55565926a678c24bd97bc5c0d766208f61e2e1e761b8ed922bdcf45381dded051b9fb71c63054b0ff4ed54ea8c8823c17b6878bb9bdf53e13249cfdfaca0c6b447acf53af69335f3fd90a74c1fe0f237eba4f23079be0c5216432e7db2c8df1bdd7f7e56d211f49b39d60ce341a917c17fb8c08b1e6af5bacbaf64a43cbde8c59fe4fed432d3&amp;zComponents=5d00000100d401000000000000003d8888a6acb5f0a6ee1a855ed9126bcc17c42306a31572cf5856ecf4a1f332320ef590ade24099a94d02481222b79b3f6829b63dfc8759602059ba41a9ef2d277f161132e41946eb57c53082611980ea6d2d747c67ea7bde9d59e2186699e8e332f2b50c7b3422a48e7be07b8f041295b37be92ba74343ce591cc27325691819710cb4e604f4248399acea327847b19e6a41468def90156efdae7dc319b58d90fc4682fffff1788f61">JQuery UI "Smoothness" Theme</a>
					</label>
				</div>
			</div>
			<br />
			<a class="btn" data-bind="css-downloads" id="css-generate">Generate CSS</a>
			<a class="btn btn-primary download-button" id="css-download" download="apeye_bundled.css">Download CSS</a>
			<br /><br />
			<textarea class="source-area default sourceView" id="generated-css-source">// Minified source</textarea>
		</section>

		<section class="custom-downloads" id="javascript-downloads">
			<div class="page-header">
				<h1>
					2. Choose JS components
					<small>Get just the JS you need</small>
				</h1>
			</div>
			<div class="row">
				<div class="span3">
					<label class="checkbox">
						<input disabled checked="checked" type="checkbox" value="dist/apeye.min.js" title="apeye.min.js">APEye
					</label>
					<label class="checkbox">
						<input type="checkbox" value="js/jquery-1.8.3.min.js" title="jquery-1.8.3.min.js">JQuery 1.8.3
					</label>
				</div>
				<div class="span3">
					<label class="checkbox">
						<input checked="checked" type="checkbox" value="dist/codemirror.min.js" title="codemirror.min.js">CodeMirror
					</label>
					<label class="checkbox">
						<input type="checkbox" value="js/jquery-ui-1.9.2.custom.min.js" title="jquery-ui.1.9.2.custom.min.js">JQuery UI 1.9.2
					</label>
				</div>
				<div class="span3">
					<label class="checkbox">
						<input checked="checked" type="checkbox" value="js/base64.min.js" title="base64.min.js">Base64 Polyfill
					</label>
				</div>
			</div><!-- /row -->
			<br />
			<a class="btn" href="#" data-bind="javascript-downloads" id="javascript-generate">Generate JS</a>
			<a class="btn btn-primary download-button" id="javascript-download" download="apeye_bundled.js">Download JS</a>
			<br /><br />
			<textarea class="source-area default sourceView" id="generated-javascript-source">// Minified source</textarea>
		</section>
	</div>
{% endblock %}
