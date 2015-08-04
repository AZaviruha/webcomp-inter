window.qs = (function() {

	// не стал делать ее в глобальном скоупе
	var qs = GetQueryString(document.location.search);

	if (qs['platform'] || !lStorage.getItem('platform')) {
		lStorage.setItem('platform', qs['platform'] || 'desktop');
	}
	if (qs['country']) {
		lStorage.setItem('country', qs['country']);
	}
	if (qs['deviceId']) {
		lStorage.setItem('deviceId', qs['deviceId']);
	}

	if (qs['context']) {
		var context = qs['context'].split(',');

		for (var i = context.length - 1; i >= 0; i--) {
			lStorage.setItem('context.' + context[i], 1);
			document.cookie = 'context.' + context[i] + '=1;  expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/apps/';
		}
	}

	return qs;

	function GetQueryString(q) {
		return (function(a) {
			if (a === '')
				return {};

			var b = {};
			for (var i = 0; i < a.length; ++i) {
				var p = a[i].split('=');
				if (p.length != 2) continue;
				b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
			}
			return b;
		})(q.replace(/^\?/, '').split('&'));
	};

})();
