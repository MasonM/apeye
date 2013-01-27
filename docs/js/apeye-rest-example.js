$(function() {
	$('#apeye-launch-rest-example').on('click', function(event) {
		$('#apeye-rest-example').show().apeye({
			// FIELD SETTERS: Auto-fill the fields with a sample request
			'url': 'api.apeye.org/rest/book/<book_id>',
			'type': 'raw',
			'httpMethod': 'get',

			// OPTIONS
			// Automatically pretty-print responses
			'autoPrettyPrint': true,
			// Always tunnel requests through an iframe (needed because the endpoint in the sample request is on a different subdomain)
			'subdomainTunneling': true,
			'autocompleteUrlSource': [
				'api.apeye.org/rest/book',
				'api.apeye.org/rest/book/<book_id>',
				'api.apeye.org/rest/author',
				'api.apeye.org/rest/author/<author_id>'
			]
		});
		$(this).hide();
		event.preventDefault();
	});
});
