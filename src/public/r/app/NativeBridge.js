// Global functions, called by iOS and Android apps
function receiveMessageFromWebView(message, data) {
	var event = document.createEvent('CustomEvent');
	if (typeof data === 'string') {
		data = JSON.parse(data);
	}
	event.initCustomEvent(message, false, false, data);
	document.dispatchEvent(event);
}

function nativeSignInCallback(options) {
	if (options.error) {
		// some kind of error
		var hideSpinner = document.createEvent('CustomEvent');
		hideSpinner.initCustomEvent('form-hide-spinners', false, false, undefined);
		document.dispatchEvent(hideSpinner);

		if (options.error === '404') {
			// no native sign in available – proceed with web version
			var authEvent = document.createEvent('CustomEvent');
			authEvent.initCustomEvent('auth-social-web', false, false, {
				'provider': options.provider
			});
			document.dispatchEvent(authEvent);
		} else if (options.error === '401') {
			// user didn't give authorization – do nothing
		} else {
			var alertEvent = document.createEvent('CustomEvent');
			alertEvent.initCustomEvent('show-error', false, false, {
				'error': '2903',
				'debug': options,
				'id': 'error-native-sign-in-error'
			});
			document.dispatchEvent(alertEvent);
		}
	} else if (options.token) {
		// success sign in
		var authEvent = document.createEvent('CustomEvent');

		lStorage.setItem('isNativeSignIn', '1');

		authEvent.initCustomEvent('auth-social', false, false, {
			'provider': options.provider,
			'token': options.token,
			'userId': options.userId,
			'email': options.email
		});
		document.dispatchEvent(authEvent);
	} else {
		// if the answer is unexpected – show error dialog
		var alertEvent = document.createEvent('CustomEvent');
		alertEvent.initCustomEvent('show-error', false, false, {
			'error': '2902',
			'debug': options,
			'id': 'error-native-sign-in-unexpected-data'
		});
		document.dispatchEvent(alertEvent);
	}
}


/**
 * Connection with the parent application
 */

if (!window.NativeBridge) {
	window.NativeBridge = {
		// by default the object is empty (for desktop browsers)
	};

	if (lStorage.getItem('platform') === 'iOS') {

		NativeBridge.callbacksCount = 1,
		NativeBridge.callbacks = {},

		/**
		 * Send request to the parent application (if exists)
		 *
		 *
		 * @param {string}    functionName  Parent app method
		 * @param {object}    args          Data sent to the parent app in json object
		 * @param {function}  callback      Callback function
		 */
		NativeBridge.call = function(functionName, args, callback) {
			var hasCallback = callback && typeof callback == 'function';
			var callbackId = hasCallback ? NativeBridge.callbacksCount++ : 0;
			if (hasCallback) {
				NativeBridge.callbacks[callbackId] = callback;
			}
			var iframe = document.createElement('IFRAME');
			var iframeUrl = 'js-frame:' + functionName + ':' + callbackId + ':' + encodeURIComponent(JSON.stringify(args));
			iframe.setAttribute('src', iframeUrl);
			document.documentElement.appendChild(iframe);
			iframe.parentNode.removeChild(iframe);
			iframe = null;
		};

		NativeBridge.resultForCallback = function(callbackId, resultArray) {
			try {
				var callback = NativeBridge.callbacks[callbackId];
				if (!callback) return;
				callback.apply(null, resultArray);
			} catch (e) {
				alert(e)
			}
		}

		NativeBridge.signedIn = function(userId, accessToken, accessTokenExpiresAtIn) {
			if (lStorage.getItem("sdkVersion") == "2") {
				this.call('signedIn', {
					userId: userId,
					accessToken: accessToken,
					accessTokenExpiresAt: accessTokenExpiresAtIn
				});
			}
			else {
				this.call('signedIn', {
					userId: userId,
					accessToken: accessToken,
					accessTokenExpiresIn: accessTokenExpiresAtIn
				});
			}
		};

		NativeBridge.doEmbryoSignIn = function() {
			this.call('doEmbryoSignIn');
		};

		NativeBridge.openBrowser = function(url, callback) {
			this.call('openBrowser', [url], callback);
		};

		NativeBridge.openWebView = function(url, callback) {
			this.call('openWebView', [url], callback);
		};

		NativeBridge.closeWebView = function() {
			this.call('closeWebView');
		};

		NativeBridge.postMessageToWebView = function(message, data, callback) {
			if (typeof data === 'string') {
				data = JSON.parse(data);
			}
			if (Array.isArray(data)) {
				data.splice(0, 0, message);
			}
			this.call('postMessageToWebView', data, callback);
		};

	}
}
