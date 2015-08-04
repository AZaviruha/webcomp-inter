(function() {

	// Common actions before page render
	// show navbar to desktop
	if (lStorage.getItem('platform') === 'desktop') {
		function setAppId() {
			var backLink = document.getElementById('backLink');
			if (backLink) {
				var path = decodeURIComponent(backLink.href);
				path = path.replace(/\${appId}/g, lStorage.getItem('appId'));
				backLink.href = path;
			}
		}
		function showBar() {
			if (document.querySelector('.NavBar')) {
				document.documentElement.classList.add('Desktop');
				setAppId();
			}
		}
		showBar();
		window.addEventListener('load', function() {
			showBar();
		});
	}
	// set appId and platform as attributes of the documentElement to manupulate with the elements via CSS
	if (lStorage.getItem('appId')) {
		document.documentElement.setAttribute('appId', lStorage.getItem('appId'));
	}
	if (lStorage.getItem('platform')) {
		document.documentElement.setAttribute('platform', lStorage.getItem('platform'));
	}

	// iOS 7.0.x viewport fixes
	var metaViewport = document.querySelector('meta[name=viewport]'),
		startViewport = (metaViewport)? metaViewport.getAttribute('content') : null;
	if (metaViewport) {
		if (navigator.userAgent.indexOf('OS 7_0') > 0 || navigator.userAgent.indexOf('OS 7_1') > 0) {
			function setViewportHeight() {
				var height = (window.innerHeight);
				if (document.getElementsByTagName('input').length) {
					height++;
					if (window.matchMedia('(max-width: 568px) and (min-width: 321px)')) {
						height += 54;
					}
				}
				metaViewport.setAttribute('content', startViewport.replace('device-width,', 'device-width, height=' + height + ','));
			}
			window.addEventListener('orientationchange', setViewportHeight);
			window.addEventListener('resize', setViewportHeight);
			window.addEventListener('load', setViewportHeight);
			setViewportHeight();
		}
	}

	requirejs.config({
		baseUrl: '/r/app',
		urlArgs: 'v=2',
		paths: {
			blocks: '/b',
			libs: '/r/libs',
			nls: '/r/nls'
		},
		config: {
			i18n: {
				locale: document.documentElement.getAttribute('lang')
			}
		}
	});

	require(['events', 'auth', 'libs/domready', 'libs/i18n!nls/auth', 'blocks/Alert/alert', 'blocks/Form/form'],
		function(events, auth, domReady, i18n_auth, alertDialog, forms) {

			domReady(function() {
				// oauth authorization via redirects
				if (qs['oauthError']) {
					events.trigger('oauth-error', [{
						provider: qs['provider'],
						error: qs['oauthError']
					}]);
				} else if (qs['oauthAccessToken']) {
					events.trigger('oauth-success', [{
						provider: qs['provider'],
						token: qs['oauthAccessToken'],
						userId: qs['oauthUserId'],
						email: qs['oauthEmail']
					}]);
				}

				// dom objects event handlers
				if (NativeBridge && NativeBridge.openBrowser) {
					events.handle('click', 'a[target=_blank]', function(evt) {
						evt.preventDefault();
						NativeBridge.openBrowser(evt.target.href);
					});
				}

				// lStorage data fill
				displayStoredData('data-local-storage');
				displayStoredData('data-session-storage');

				// Searching for all links and replacing variable placeholders in href with data
				// from localStorage.
				parseLinksUrl();
			});

		}
	);

	function displayStoredData(storageAttr) {
		var useStorage = (storageAttr !== 'data-session-storage') ? lStorage : sStorage;
		var lStorageDataEls = document.querySelectorAll('[' + storageAttr + ']');
		for (var i = 0, leni = lStorageDataEls.length; i < leni; i++) {
			var el = lStorageDataEls[i];
			var key = el.getAttribute(storageAttr);
			if (['input', 'textarea'].indexOf(el.tagName.toLowerCase()) >= 0) {
				el.value = useStorage.getItem(key);
			} else {
				el.innerHTML = useStorage.getItem(key);
			}
		}
	}

	function parseLinksUrl() {
		var links = document.querySelectorAll('a');

		for (var i = 0, length = links.length, link; i < length; i++) {
			link = links[i];
			link.setAttribute('href', link.getAttribute('href').replace(/\${([^}]+)}/g, function(match, key) {
				return lStorage.getItem(key) || '';
			}));
		}
	}
})();
