var apiUrl = document.querySelector('script[src*="api.js"]').getAttribute('data-api-url');

if (apiUrl.indexOf('//') === 0) {
	apiUrl = document.location.protocol + apiUrl;
}

var api = {
	getUrl: function(resource) {
		var path = resource.replace(/\${appId}/g, lStorage.getItem('appId'))
			.replace(/\${userId}/g, lStorage.getItem('userId'));


		if (resource.indexOf('http') === 0) {
			return path;
		} else {
			return apiUrl + path;
		}
	},

	/**
	 * XHR Request function to the API
	 *
	 * @param {object} options
	 *   @param {string}   options.uri      String, request uri
	 *   @param {string}   options.method   String, request method (GET, POST, PUT, DELETE...)
	 *   @param {object}   options.headers  Hash with additional headers objects { 'name': 'value', ... }
	 *   @param {boolean}  options.token    Include access token to request or not
	 *   @param {function} options.callback Link to a callback method
	 */
	call: function(options) {
		var httpRequest = new XMLHttpRequest();

		httpRequest.onload = httpRequest.onerror = function(evt) {
			if (httpRequest.status &&  httpRequest.status >= 500) {
				document.location.href = window.location.protocol + '//' + window.location.host + '/maintenance?returnTo=' + encodeURIComponent(window.location.pathname);
			} else {
				options.callback(evt, httpRequest);
			}
		};

		httpRequest.open(options.method, api.getUrl(options.uri));

		if (options.headers) {
			for (var headerName in options.headers) {
				httpRequest.setRequestHeader(headerName, options.headers[headerName]);
			}
		}

		if (options.token) {
			httpRequest.setRequestHeader('Authorization', 'Bearer ' + (options.token === true ? lStorage.getItem("accessToken") : options.token));
		}

		var body = options.body || null;

		if ((options.method == 'POST' || options.method == 'PUT') && body) {
			httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}

		httpRequest.send(body);
	}
};
