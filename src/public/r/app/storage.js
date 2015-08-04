(function() {
	function CookieStorage(expireString) {
		var items = {};
		// fill values from the actual cookies
		var cookies = document.cookie.split(';');
		for (var i = 0, len = cookies.length; i < len; i++) {
			var cookie = cookies[i].split('=');
			var name = decodeURIComponent(cookie[0]);
			name = name.replace(/^\s+|\s+$/g, '');
			items[decodeURIComponent(name)] = decodeURIComponent(cookie[1]);
		}
		
		function setItem(name, value) {
			items[name] = value;
			document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';' + expireString + ' path=/';
		}
		function getItem(name) {
			if (items[name])
				return items[name].toString()
			else
				return null;
		}
		function removeItem(name) {
			delete items[name];
			document.cookie = encodeURIComponent(name) + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
		}
		
		return {
			setItem: setItem,
			getItem: getItem,
			removeItem: removeItem,
			items: items
		}
	}
	
	if (window.localStorage) {
		window.lStorage = window.localStorage;
	} else {
		window.lStorage = new CookieStorage(' expires=Fri, 31 Dec 9999 23:59:59 GMT;');
	}
	if (window.sessionStorage) {
		window.sStorage = window.sessionStorage;
	} else {
		window.sStorage = new CookieStorage('');
	}
})()
