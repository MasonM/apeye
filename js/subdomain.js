/* Use this script if you need to communicate with across subdomains.
   Based on code written by Ben Vinegar: http://benv.ca/2011/3/7/subdomain-tunneling-with-jquery-and-document-domain/
*/

/**
 * Replace $.ajax on your subdomain with a copy taken
 * from your base domain. All jQuery AJAX actions go
 * through $.ajax (i.e. $.get, $.post), so it's all good.
 */
(function() {
	// This has to be set both here and in tunnel.html
	document.domain = 'explorpc.org';

	// Back up this page's copy of $.ajax
	window.$._ajax = window.$.ajax;

	$('<iframe>')
		.attr('src', 'http://api.explorpc.org/tunnel.html')
		.load(function() {
			// Our prize: a version of $.ajax that can communicate safely
			// with our base domain
			window.$.ajax = this.contentWindow.jQuery.ajax;
		})
		.appendTo('head');
})();
