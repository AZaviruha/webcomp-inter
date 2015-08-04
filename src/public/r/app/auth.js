define(['events', 'libs/base64.min', 'blocks/Alert/alert', 'libs/i18n!nls/auth'], function(events, Base64, alertDialog, i18n_auth) {

	/* * * * * * * * * * * * * * * * */
	/*	 Capturing auth events	 */
	/* * * * * * * * * * * * * * * * */


	/**
	 * Merge embryo account with main account
	 */
	function processEmbryoAccount(callbackEventName) {

		var callback = function() {
			events.trigger(callbackEventName);
		};

		// 1 проверяем наличие Embryo пользователя
		authorizeAsEmbryo(function(evt, response) {
			switch (response.status) {
				case 200: // Successfully authorized

					var responseJson = JSON.parse(response.responseText);
					if (responseJson.userId !== lStorage.getItem('userId')) {
						var embryoUserId = responseJson.userId,
							embryoUserToken = responseJson.accessToken;

						// 2 Проверяем наличие сервис аккаунта у Embryo пользователя
						return getServiceAccount({
							userId: embryoUserId,
							userToken: embryoUserToken
						}, function(embryoServiceAccount) {

							if (embryoServiceAccount) {

								// 3 Проверяем наличие сервис аккаунта у обычного пользователя
								getServiceAccount({
									userId: lStorage.getItem('userId'),
									userToken: true
								}, function(userServiceAccount) {

									if (userServiceAccount) {

										// 4. Есть аккаунт выводим предупреждение об удалении персонажа
										lStorage.setItem('embryoUserId', embryoUserId);
										lStorage.setItem('embryoUserToken', embryoUserToken);
										lStorage.setItem('embryoServiceAccountId', embryoServiceAccount.accountId);

										lStorage.setItem('deleteEmbryoEventName', callbackEventName);

										window.location.href = window.location.protocol + '//' + window.location.host + '/account-conflict';

										// после подверждения
										// DELETE/PUT contact от embryo
										// Unlink Service аккаунт от embryo
										// СМ метод relinkEmbryoServiceAccount

									} else {
										//DELETE / PUT contact от embryo
										//Link / Unlink Service аккаунт от embryo
										relinkEmbryoServiceAccount({
											embryoUserId: embryoUserId,
											embryoUserToken: embryoUserToken,
											embryoServiceAccountId: embryoServiceAccount.accountId,
											needLinkServiceAccount: true
										}, callback);
									}
								});

							} else {
								// DELETE/PUT contact от embryo к обычному пользователю
								relinkEmbryoContact({
									embryoUserId: embryoUserId,
									embryoUserToken: embryoUserToken
								}, callback);
							}
						});
					}

					break;
				case 401: // no such embryo user
				case 403: // or the user is already deleted or blocked
					// just call the original callback
					events.trigger(callbackEventName);
					break;
				default:
					// for all other errors – show error dialog box
					events.trigger('form-hide-spinners');
					alertDialog.show(
						i18n_auth.AlertDialogTitle + ' 2902',
						i18n_auth.UnexpectedAnswer,
						i18n_auth.CloseBtn, null, {
							'method': 'authorizeAsEmbryo',
							'status': response.status,
						},
						'error-authorize-as-embryo'
					);
			}
		});
	}

	/**
	 * Try authorize as embryo without save userId, token to localStorage
	 * @param  {Function} callback
	 */
	function authorizeAsEmbryo(callback) {
		if (lStorage.getItem('deviceId')) {
			var headers = {
				'Authorization': 'Embryo ' + lStorage.getItem('platform') + '-' + lStorage.getItem('deviceId')
			};

			// 1 проверяем наличие ембрио аккаунта
			api.call({
				uri: '/me/issue-token',
				method: 'POST',
				headers: headers,
				callback: callback
			});
		} else {
			callback(null, {
				status: 401
			});
		}
	}

	/**
	 * Get Embryo service account
	 * @param  {[Object} {embryoUserId, embryoUserToken }
	 * @param  {Function} callback
	 */
	function getServiceAccount(options, callback) {
		var userId = options.userId,
			userToken = options.userToken;

		if (userId) {
			// получаем сервис аккаунт
			api.call({
				uri: '/users/' + userId + '/accounts?appId=${appId}',
				method: 'GET',
				token: userToken,
				callback: function(evt, response) {
					if (response.status === 200) {
						var responseJson = JSON.parse(response.responseText),
							serviceAccount = responseJson[0];

						callback(serviceAccount);
					} else {
						events.trigger('form-hide-spinners');
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2903',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.CloseBtn, null, {
								'method': 'getServiceAccount',
								'userId': options.userId,
								'userToken': options.userToken
							},
							'error-merge-embryo-get-accounts'
						);
					}
				}
			});

		} else {
			callback(0);
		}
	}

	/**
	 * Unlink service account from emryo, unlink/link contact data from embryo to other main account
	 * @param  {Object} {embryoUserId, embryoUserToken }
	 * @param  {Function} callback
	 */
	function relinkEmbryoServiceAccount(options, callback) {
		var embryoUserId = options.embryoUserId,
			contact = 'embryo:' + lStorage.getItem('platform') + '-' + lStorage.getItem('deviceId'),
			embryoUserToken = options.embryoUserToken,
			embryoServiceAccountId = options.embryoServiceAccountId,
			needLinkServiceAccount = options.needLinkServiceAccount;

		if (embryoUserId) {
			// Unlink Service аккаунт от embryo
			api.call({
				uri: '/users/' + embryoUserId + '/accounts/' + embryoServiceAccountId,
				method: 'DELETE',
				token: embryoUserToken,
				callback: function(evt, response) {

					if (response.status === 204) {
						if (needLinkServiceAccount) {
							api.call({
								uri: '/users/${userId}/accounts/' + embryoServiceAccountId,
								method: 'PUT',
								token: true,
								callback: function(evt, response) {
									if (response.status === 204) {
										//DELETE/PUT contact от embryo
										relinkEmbryoContact(options, callback);
									} else {
										events.trigger('form-hide-spinners');
										alertDialog.show(
											i18n_auth.AlertDialogTitle + ' 2908',
											i18n_auth.UnexpectedAnswer,
											i18n_auth.CloseBtn, null, {
												'method': 'relinkEmbryoServiceAccount',
												'method': 'put',
												'userId': lStorage.getItem('userId'),
												'embryoUserId': embryoUserId,
												'embryoServiceAccountId': embryoServiceAccountId
											},
											'error-link-embryo-servive-account'
										);
									}
								}
							});

						} else {
							//DELETE/PUT contact от embryo
							relinkEmbryoContact(options, callback);
						}
					} else {
						events.trigger('form-hide-spinners');
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2907',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.CloseBtn, null, {
								'method': 'relinkEmbryoServiceAccount',
								'method': 'delete',
								'embryoUserId': embryoUserId,
								'embryoServiceAccountId': embryoServiceAccountId
							},
							'error-delete-embryo-service-account'
						);

					}
				}
			});
		}

	}

	/**
	 * DELETE/PUT contact от embryo к обычному пользователю
	 * @param  {Object} {embryoUserId, embryoUserToken }
	 * @param  {Function} callback
	 */
	function relinkEmbryoContact(options, callback) {
		var embryoUserId = options.embryoUserId,
			contact = 'embryo:' + lStorage.getItem('platform') + '-' + lStorage.getItem('deviceId'),
			embryoUserToken = options.embryoUserToken;

		//DELETE/PUT contact от embryo
		api.call({
			uri: '/users/' + embryoUserId + '/contacts/' + contact,
			method: 'DELETE',
			token: embryoUserToken,
			callback: function(evt, response) {
				if (response.status === 204) {
					// привязываем контакт устройства к обычному юзеру
					api.call({
						uri: '/users/${userId}/contacts/' + contact,
						method: 'PUT',
						token: true,
						callback: function(evt, response) {
							if (response.status === 201) {
								callback();
							} else {
								events.trigger('form-hide-spinners');
								alertDialog.show(
									i18n_auth.AlertDialogTitle + ' 2906',
									i18n_auth.UnexpectedAnswer,
									i18n_auth.CloseBtn, null, {
										'method': 'relink-embryo-contact',
										'method': 'put',
										'userId': lStorage.getItem('userId'),
										'embryoUserId': embryoUserId,
										'embryoUserToken': embryoUserToken
									},
									'error-set-embryo-to-account'
								);
							}
						}
					});
				} else {
					events.trigger('form-hide-spinners');
					alertDialog.show(
						i18n_auth.AlertDialogTitle + ' 2905',
						i18n_auth.UnexpectedAnswer,
						i18n_auth.CloseBtn, null, {
							'method': 'relinkEmbryoContact',
							'method': 'delete',
							'embryoUserId': embryoUserId,
							'embryoUserToken': embryoUserToken
						},
						'error-delete-embryo'
					);
				}
			}
		});

	}

	events.handle('merge-embryo-account', function(evt) {
		var data = evt.detail || {},
			callbackEventName = "process-embryo-account-callback-event";

		lStorage.setItem('processEmbryoAccountCallbackEventName', data.callbackEventName || 'auth-send-signed-in-command');
		processEmbryoAccount(callbackEventName);
	});

	events.handle('process-embryo-account-callback-event', function(evt) {
		events.trigger(lStorage.getItem('processEmbryoAccountCallbackEventName'));
		lStorage.removeItem('processEmbryoAccountCallbackEventName');
	});

	events.handle('trigger-redirect-to-success', function() {
		var provider = (lStorage.getItem('successProvider'))? '&provider=' + lStorage.getItem('successProvider') : '';
		window.location.href = window.location.protocol + '//' + window.location.host + '/success?appId=' + lStorage.getItem('appId') + provider;
	});

	events.handle('auth-check-success-page', function(evt) {
		var data = evt.detail;

		// set cookie to permanently hide ‘Play without registration’ button on home page
		document.cookie = 'context.no_embryo=1;  expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/apps/';

		if (lStorage.getItem('userId')) {

			// check whether or not show the success page
			if (
				(!lStorage.getItem('successPage') || lStorage.getItem('successPage') != 'shown') &&
				lStorage.getItem('showSuccessPage') && lStorage.getItem('showSuccessPage').indexOf(data.successType) >= 0
			) {
				// checking for app account existence
				api.call({
					uri: '/users/${userId}/accounts?appId=${appId}',
					method: 'GET',
					headers: {
						'Authorization': 'bearer ' + lStorage.getItem('accessToken')
					},
					callback: function(evt, response) {
						if (response && response.responseText) {
							var responseJson = JSON.parse(response.responseText);
							if (responseJson.length) {
								// account for this appId is already created
								events.trigger('merge-embryo-account', {
									callbackEventName: 'auth-send-signed-in-command'
								});
							} else {
								// first sign-in – redirecting to the success page
								events.trigger('merge-embryo-account', {
									callbackEventName: 'trigger-redirect-to-success'
								});
							}
						}
					}
				})
			} else {
				events.trigger('merge-embryo-account', {
					callbackEventName: 'auth-send-signed-in-command'
				});
			}

		} else {
			alertDialog.show(
				i18n_auth.AlertDialogTitle + ' 2104',
				i18n_auth.UnexpectedAnswer,
				i18n_auth.CloseBtn,
				null, {
					'method': 'auth-check-success-page',
					'reason': 'No userId in lStorage',
					'userId': lStorage('userId')
				},
				'error-auth-check-success-page'
			);
			events.trigger('form-hide-spinners');
		}
	});


	/**
	 * Login event
	 *
	 * parameters are sent by detail event param
	 *
	 * @param {string} login
	 * @param {string} password
	 * @param {number} [captcha-id]
	 * @param {number} [captcha-value]
	 */
	events.handle('sign-in-with-password', function(evt) {
		var data = evt.detail;
		if (data.login && data.password) {
			// prepare headers
			var headers = {
				'Authorization': 'Basic ' + Base64.encode(data.login + ":" + data.password)
			};
			if (data['captcha-id']) {
				headers['Human-Validation'] = 'Captcha id=' + data['captcha-id'] + ',value=' + data['captcha-value'];
			}
			// call
			api.call({
				uri: '/me/issue-token',
				method: 'POST',
				headers: headers,
				body: 'tokenType=long_lived',
				callback: function(evt, response) {
					switch (response.status) {
						case 200: // Authenticated
							// hide captcha field
							events.trigger('form-hide-captcha');

							// get the actual json response
							var responseJson = JSON.parse(response.responseText);

							// store user id and token, and expiration in local storage
							lStorage.setItem('phone', data.login);
							sStorage.setItem('password', data.password);
							lStorage.setItem('userId', responseJson.userId);
							lStorage.setItem('accessToken', responseJson.accessToken);
							lStorage.setItem('accessTokenExpiresIn', responseJson.expiresIn);
							lStorage.removeItem('successProvider');

							// sign in user
							events.trigger('auth-check-success-page', {
								successType: data.successType || 'on-first-sign-in'
							});
							break;
						case 401: // Invalid password
							events.trigger('form-error', 'invalid-credentials');
							events.trigger('form-hide-spinners');
							break;
						case 403:
							events.trigger('form-error', 'blocked-account');
							events.trigger('form-hide-spinners');
							break;
						case 429:
						case 412: // Bruteforce detected
							events.trigger('form-show-captcha', 'invalid-credentials');
							events.trigger('form-hide-spinners');
							break;
						default: // Other error
							alertDialog.show(
								i18n_auth.AlertDialogTitle + ' 2102',
								i18n_auth.UnexpectedAnswer,
								i18n_auth.CloseBtn,
								null, {
									'method': 'sign-in-with-password',
									'status': response.status
								},
								'error-sign-in-with-password'
							);
							events.trigger('form-hide-spinners');
							break;
					}
				}
			});
		} else {
			alertDialog.show(
				i18n_auth.AlertDialogTitle + ' 2101',
				i18n_auth.UnexpectedAnswer,
				i18n_auth.CloseBtn, null,
				null,
				'error-empty-sign-in-form'
			);
		}
	});

	events.handle('success-sign-in', function(evt) {
		var data = evt.detail;
		events.trigger('form-hide-spinners');
		if (
			data.userId && data.userId != '' &&
			data.accessToken && data.accessToken != '' &&
			data.accessTokenExpiresIn && data.accessTokenExpiresIn != ''
		) {
			events.trigger('auth-send-signed-in-command');
		} else {
			alertDialog.show(
				i18n_auth.AlertDialogTitle + ' 2103',
				i18n_auth.UnexpectedAnswer,
				i18n_auth.CloseBtn, null, {
					'method': 'success-sign-in',
					'userId': data.userId,
					'accessToken': data.accessToken,
					'accessTokenExpiresIn': data.accessTokenExpiresIn
				},
				'error-empty-sign-in-form'
			);
		}
	});

	events.handle('auth-send-signed-in-command', function(evt) {
		events.trigger('form-hide-spinners');
		if (window.NativeBridge && NativeBridge.signedIn) {

			if (lStorage.getItem("sdkVersion") == "2") {
				var strExpiresAt = String(Date.now()+parseFloat(lStorage.getItem("accessTokenExpiresIn"))*1000);
				NativeBridge.signedIn(
					lStorage.getItem("userId"),
					lStorage.getItem("accessToken"),
					strExpiresAt
				);
			} else {
				NativeBridge.signedIn(
					lStorage.getItem("userId"),
					lStorage.getItem("accessToken"),
					lStorage.getItem("accessTokenExpiresIn")
				);
			}
		} else {
			alertDialog.show(
				'Вход успешен',
				'Вы авторизованы в Фогейме. Теперь можно играть.',
				i18n_auth.CloseBtn, null, {
					'userId': lStorage.getItem("userId"),
					'accessToken': lStorage.getItem("accessToken"),
					'a': parseFloat(lStorage.getItem("accessTokenExpiresIn")),
					'accessTokenExpiresIn': Date.now()+(parseFloat(lStorage.getItem("accessTokenExpiresIn"))*1000)
				},
				'successful-sign-in'
			);
		}
	});

	events.handle('auth-send-confirm-code', function(evt) {
		var data = evt.detail;
		data.login = data.login.replace(/\s/g, '');

		var headers = {};
		if (data['captcha-id']) {
			headers['Human-Validation'] = 'Captcha id=' + data['captcha-id'] + ',value=' + data['captcha-value'];
		}
		// check if user exists
		api.call({
			uri: '/users?contact=tel:' + encodeURIComponent(data.login),
			method: 'GET',
			callback: function(evt, response) {
				switch (response.status) {
					case 200: // OK
						var responseArray = JSON.parse(response.responseText);
						if (responseArray.length) {
							// this phone number already exists
							events.trigger('sign-in-with-password', {
								login: data.login,
								password: data.password,
								successType: 'on-first-sign-in'
							});
						} else {
							// send text message
							api.call({
								uri: '/auth/send-confirm-code',
								method: 'POST',
								headers: headers,
								body: 'contacts.provider=tel&contacts.id=' + encodeURIComponent(data.login),
								callback: function(evt, response) {
									switch (response.status) {
										case 202: // Accepted
											events.trigger('form-hide-captcha');

											// store phone and password in local storage
											lStorage.setItem('phone', data.login);
											sStorage.setItem('password', data.password);

											// redirect to confirmation page
											document.location.href = window.location.protocol + '//' + window.location.host + '/confirmation';

											break;
										case 400:
										case 412:
										case 429: // Bruteforce detected
											events.trigger('form-show-captcha', 'invalid-credentials');
											events.trigger('form-hide-spinners');
											break;
										default: // Unknown error
											// refresh captcha and stop spineers
											events.trigger('form-refresh-captcha');
											events.trigger('form-hide-spinners');
											// show error dialog
											alertDialog.show(
												i18n_auth.AlertDialogTitle + ' 2402',
												i18n_auth.UnexpectedAnswer,
												i18n_auth.CloseBtn, null, {
													'response.status': response.status,
													'method': 'auth-send-confirm-code',
													'contacts.provider': 'tel',
													'contacts.id': data.login
												},
												'error-auth-send-confirm-code'
											);
									}
								}
							});
						}
						break;
					case 400:
					case 412:
					case 429: // Bruteforce detected
						events.trigger('form-show-captcha', 'invalid-credentials');
						events.trigger('form-hide-spinners');
						break;
					default: // Unknown error
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2401',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.CloseBtn, null, {
								'method': 'auth-check-contact',
								'status': response.status,
								'contact': 'tel:' + data.login
							},
							'error-check-user'
						);
				}
			}
		});
	});

	events.handle('auth-sign-up', function(evt) {
		var data = evt.detail;

		var headers = {};
		if (data['captcha-id']) {
			headers['Human-Validation'] = 'Captcha id=' + data['captcha-id'] + ',value=' + data['captcha-value'];
		}
		var body = prepareSignUpParams('tel');
		body += '&contacts.id=' + encodeURIComponent(data.login);
		body += '&contacts.password=' + encodeURIComponent(data.password);
		body += '&contacts.token=' + data.pinCode;

		// create new user
		api.call({
			uri: '/auth/sign-up',
			method: 'POST',
			headers: headers,
			body: body,
			callback: function(evt, response) {
				switch (response.status) {
					case 201: // User created
						// hide captcha field
						events.trigger('form-hide-captcha');

						// get the actual json response
						var responseJson = JSON.parse(response.responseText);
						if (responseJson.userId) {
							// user was successfully registered

							// we're redirecting to the success page
							events.trigger('sign-in-with-password', {
								login: data.login,
								password: data.password,
								successType: 'on-sign-up'
							});
							break;
						}
					case 409: // Invalid or expired pin-code
						var responseHash = JSON.parse(response.responseText);
						// expired code have specific error
						if (
							responseHash &&
							responseHash['error'] &&
							responseHash['error'].toLowerCase() === 'no_such_contact_or_confirm_code'
						) {
							alertDialog.show(
								i18n_auth.PinCodeExpired,
								i18n_auth.PinCodeExpiredDescription,
								i18n_auth.SendNewPinCodeBtn, function(evt) {
									window.location.href = window.location.protocol + '//' + window.location.host + '/sign-up-mobile';
									return false;
								}, {
									'method': 'auth-sign-up',
									'status': response.status,
									'error': responseHash['error'],
									'description': responseHash['description']
								},
								'error-check-user'
							);
						} else {
							events.trigger('form-error', 'invalid-credentials');
						}
						events.trigger('form-hide-spinners');
						break;
					case 400:
					case 412:
					case 429: // Bruteforce detected
						events.trigger('form-show-captcha', 'invalid-credentials');
						events.trigger('form-hide-spinners');
						break;
					default: // Unknown error
						// refresh captcha and stop spinners
						events.trigger('form-refresh-captcha');
						events.trigger('form-hide-spinners');
						// show error dialog
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2501',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.CloseBtn, null, {
								'method': 'auth-sign-up',
								'status': response.status,
								'contacts.provider': 'tel',
								'contacts.id': data.login,
								'contacts.password': data.password,
								'contacts.token': data.pinCode
							},
							'error-check-user'
						);
				}
			}

		});
	});


	/**
	 * Sign Up new account linked with social service
	 *
	 * @param {string} provider
	 * @param {string} token
	 */
	events.handle('auth-social-sign-up', function(evt) {
		var data = evt.detail;

		var body = prepareSignUpParams(data.provider);
		body += '&contacts.token=' + data.token;
		body += '&contacts.app=' + getProviderAppId(data.provider);

		api.call({
			uri: '/auth/sign-up',
			method: 'POST',
			body: body,
			callback: function(evt, response) {

				if (response.status === 201) {
					responseText = JSON.parse(response.responseText);
					lStorage.setItem('accountId', responseText.userId);
					// there is an account – back to auth-social
					events.trigger('auth-social', {
						provider: data.provider,
						token: data.token,
						email: data.email
					});
				} else {
					var responseText = {};
					if (response.responseText) {
						responseText = JSON.parse(response.responseText);
					}
					alertDialog.show(
						i18n_auth.AlertDialogTitle + ' 2601',
						i18n_auth.UnexpectedAnswer,
						i18n_auth.CloseBtn, null, {
							'method': 'auth-social-sign-up',
							'status': response.status,
							'error': responseText.error || '',
							'description': responseText.description || ''
						},
						'error-sign-up'
					);
				}
			}
		});
	});


	/**
	 * Authorize user using token from social provider
	 *
	 * parameter are sent by detail event param
	 * @param {string} provider Name of the social service provider for request header
	 * @param {string} token
	 * @param {string} userId  Id of the user in the social service provider
	 * @param {string} email   Email returned by the social service provider
	 */
	events.handle('auth-social', function(evt) {
		var data = evt.detail;

		// store values in lStorage
		lStorage.setItem('oauthProvider', data.provider);
		lStorage.setItem('oauthUserId', data.userId);
		lStorage.setItem('oauthToken', data.token);
		lStorage.setItem('oauthEmail', data.email);

		var headers = {
			'Authorization': data.provider + ' ' + Base64.encode(getProviderAppId(data.provider) + ":" + data.token)
		};

		api.call({
			uri: '/me/issue-token',
			method: 'POST',
			headers: headers,
			body: 'tokenType=long_lived',
			callback: function(evt, response) {
				switch (response.status) {
					case 200: // Athenticated
						// get the actual json response
						var responseJson = JSON.parse(response.responseText);

						// store user id and token, and expiration in local storage
						lStorage.setItem('userId', responseJson.userId);
						lStorage.setItem('accessToken', responseJson.accessToken);
						lStorage.setItem('accessTokenExpiresIn', responseJson.expiresIn);

						lStorage.setItem('successProvider', data.provider);

						// sign in user
						events.trigger('auth-check-success-page', {
							successType: 'on-first-sign-in'
						});

						break;
					case 401: // Invalid credentials – means user not found
						if (data.email) {
							// looking for existing 4game user
							api.call({
								uri: '/users?contact=email:' + data.email,
								method: 'GET',
								callback: function(evt, response) {
									if (response && response.responseText) {
										var responseJson = JSON.parse(response.responseText);
										if (responseJson && responseJson[0] && responseJson[0].userId) {
											// there is current user – redirect to linking page
											lStorage.setItem('userId', responseJson[0].userId);
											window.location.href = window.location.protocol + '//' + window.location.host + '/social-link';
										} else {
											// no current user - creating a new one
											events.trigger('auth-social-sign-up', {
												provider: data.provider,
												token: data.token,
												email: data.email
											});
										}
									} else {
										alertDialog.show(
											i18n_auth.AlertDialogTitle + ' 2702',
											i18n_auth.UnexpectedAnswer,
											i18n_auth.CloseBtn, null, {
												'method': 'auth-social-get-user',
												'status': response.status
											},
											'error-auth-social'
										);
									}
								}
							});
						} else {
							// there's no email field returned by the server
							// creating new user
							events.trigger('auth-social-sign-up', {
								provider: data.provider,
								token: data.token
							});
						}
						break;
					default: // Other error
						events.trigger('form-hide-spinners');
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2701',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.CloseBtn, null, {
								'method': 'auth-social',
								'status': response.status
							},
							'error-auth-social'
						);
						break;
				}
			}
		});
	});

	/**
	 * Check password to Link social service account to 4game one
	 *
	 * parameter are sent by detail event param
	 * @param {string} password
	 * @param {number} [captcha-id]
	 * @param {number} [captcha-value]
	 */
	events.handle('auth-link-social-auth', function(evt) {
		var data = evt.detail;
		var login = lStorage.getItem('oauthEmail')

		if (login && data.password) {
			// prepare headers
			var headers = {
				'Authorization': 'Basic ' + Base64.encode(login + ":" + data.password)
			};
			if (data['captcha-id']) {
				headers['Human-Validation'] = 'Captcha id=' + data['captcha-id'] + ',value=' + data['captcha-value'];
			}
			// call
			api.call({
				uri: '/me/issue-token',
				method: 'POST',
				headers: headers,
				body: 'tokenType=long_lived',
				callback: function(evt, response) {
					switch (response.status) {
						case 200: // Authenticated
							// hide captcha field
							events.trigger('form-hide-captcha');
							// get the actual json response
							var responseJson = JSON.parse(response.responseText);

							// store user id and token, and expiration in local storage
							lStorage.setItem('userId', responseJson.userId);
							lStorage.setItem('accessToken', responseJson.accessToken);
							lStorage.setItem('accessTokenExpiresIn', responseJson.expiresIn);

							// link social account to user
							events.trigger('auth-link-social');
							break;
						case 401: // Invalid password
							events.trigger('form-error', 'invalid-credentials');
							events.trigger('form-hide-spinners');
							break;
						case 429:
						case 412: // Bruteforce detected
							events.trigger('form-show-captcha', 'invalid-credentials');
							events.trigger('form-hide-spinners');
							break;
						default: // Other error
							alertDialog.show(
								i18n_auth.AlertDialogTitle + ' 2802',
								i18n_auth.UnexpectedAnswer,
								i18n_auth.CloseBtn, null, {
									'method': 'auth-link-social-auth',
									'status': response.status
								},
								'error-auth-link-social'
							);
							events.trigger('form-hide-spinners');
							break;
					}
				}
			});
		} else {
			alertDialog.show(
				i18n_auth.AlertDialogTitle + ' 2801',
				i18n_auth.UnexpectedAnswer,
				i18n_auth.CloseBtn, null,
				null,
				'error-empty-sign-in-form'
			);
		}
	});

	/**
	 * Link social service account to 4game one
	 */
	events.handle('auth-link-social', function(evt) {
		api.call({
			uri: '/users/${userId}/contacts/' + lStorage.getItem('oauthProvider') + ':' + lStorage.getItem('oauthUserId'),
			method: 'PUT',
			headers: {
				'Authorization': 'Bearer ' + lStorage.getItem('accessToken')
			},
			body: 'contacts.token=' + lStorage.getItem('oauthToken') + '&contacts.app=' + getProviderAppId(lStorage.getItem('oauthProvider')),
			callback: function(evt, response) {
				switch (response.status) {
					case 201: // New contact bound to user
					case 204: // Contact updated
						events.trigger('form-hide-spinners');

						lStorage.setItem('successProvider', lStorage.getItem('oauthProvider'));

						// sign in user
						events.trigger('auth-check-success-page', {
							successType: 'on-first-sign-in'
						});
						break;
					default:
						alertDialog.show(
							i18n_auth.AlertDialogTitle + ' 2803',
							i18n_auth.UnexpectedAnswer,
							i18n_auth.BackBtn, function() {
								window.history.go(-2);
							}, {
								'method': 'auth-link-social',
								'status': response.status,
								'provider': lStorage.getItem('oauthProvider'),
								'providerAppId': getProviderAppId(lStorage.getItem('oauthProvider'))
							},
							'error-auth-link-social'
						);
						events.trigger('form-hide-spinners');
						break;
				}
			}
		});
	});

	function getProviderAppId(provider) {
		if (lStorage.getItem('isNativeSignIn') && lStorage.getItem(provider + "NativeAppId")) {
			return lStorage.getItem(provider + "NativeAppId");
		} else {
			return lStorage.getItem(provider + "AppId");
		}
	}

	function prepareSignUpParams(provider) {
		var body = 'contacts.provider=' + provider;

		if (lStorage.getItem('country')) {
			body += '&country=' + encodeURIComponent(lStorage.getItem('country'));
		}

		body += '&appId=' + lStorage.getItem('appId');
		body += '&originApp=mobile';

		return body;
	}

	/**
	 * Facebook login event
	 *
	 * listening to the click event to avoid the popup blockers
	 */
	events.handle('click', '.Button-Type-facebook, .Button-Type-vkontakte', function(evt) {
		var provider;
		if (this.classList.contains('Button-Type-facebook')) {
			provider = 'fb';
		} else if (this.classList.contains('Button-Type-vkontakte')) {
			provider = 'vk';
		}
		if (provider) {
			this.classList.add('Button-State-spinner');
			//if (window.NativeBridge && NativeBridge.nativeSignIn) {
			//	lStorage.setItem('isNativeSignIn', '1');
			//	// there is nativeSignIn method
			//	NativeBridge.nativeSignIn(provider, getProviderAppId(provider), 'nativeSignInCallback');
			//} else {
				events.trigger('auth-social-web', {
					provider: provider
				});
			//}
		}
		return false;
	}, true);

	events.handle('auth-social-web', function(evt) {
		var data = evt.detail;

		if (data.provider) {
			var serverUrl = window.location.protocol + '//' + window.location.host;
			var providerAppId = getProviderAppId(data.provider);
			if (window.NativeBridge && NativeBridge.openWebView) {
				NativeBridge.openWebView(api.getUrl('/auth/external/' + data.provider.toLowerCase() + '/' + providerAppId + '?returnUrl=' + encodeURIComponent(serverUrl + '/oauth-confirm?provider=' + data.provider)));
				setTimeout(function() {
					events.trigger('form-hide-spinners');
				}, 1000);
			} else {
				window.location.href = api.getUrl('/auth/external/' + data.provider.toLowerCase() + '/' + providerAppId + '?returnUrl=' + encodeURIComponent(serverUrl + window.location.pathname + '?provider=' + data.provider));
			}

		}
	});


	// doEmbryoSignIn
	events.handle('click', '#doEmbryoSignInBtn', function() {
		if (window.NativeBridge && NativeBridge.doEmbryoSignIn) {
			NativeBridge.doEmbryoSignIn();
		} else {
			alertDialog.show(
				i18n_auth.AlertDialogTitle + ' 2901',
				i18n_auth.UnexpectedAnswer,
				i18n_auth.CloseBtn, null, {
					'platform': lStorage.getItem('platform')
				},
				'error-native-sign-in'
			);
		}
	});

	// doDeleteEmbryo
	events.handle('use-saved-game-account', function() {
		relinkEmbryoServiceAccount({
			embryoUserId: lStorage.getItem('embryoUserId'),
			embryoUserToken: lStorage.getItem('embryoUserToken'),
			embryoServiceAccountId: lStorage.getItem('embryoServiceAccountId')
		}, function() {
			events.trigger(lStorage.getItem('deleteEmbryoEventName'));
		});
	});

	events.handle('oauth-error', function(evt) {
		var data = evt.detail[0];
		alertDialog.show(
			i18n_auth.AlertDialogTitle + ' 2804',
			i18n_auth.UnexpectedAnswer,
			i18n_auth.CloseBtn, null, {
				'data.provider': data.provider,
				'data.error': data.error
			},
			'error-oauth'
		);
	});

	events.handle('oauth-success', function(evt) {
		var data = evt.detail[0];
		events.trigger('auth-social', {
			provider: data.provider,
			token: data.token,
			userId: data.userId,
			email: data.email
		});
	});

	events.handle('rate-limit-check', function(evt) {
		var data = evt.detail;
		api.call({
			uri: data.uri,
			method: 'OPTIONS',
			// headers: {
			//	'X-Rate-Limit-Force': true
			// },
			callback: function(evt, response) {
				var headers = response.getAllResponseHeaders();
				if (headers && headers.indexOf('X-Rate-Limit-Remaining') >= 0) {
					if (parseInt(response.getResponseHeader('X-Rate-Limit-Remaining'), 10) === 0) {
						events.trigger('form-show-captcha', 'initial');
					}
				}
			}
		});
	});

	events.handle('show-error', function(evt) {
		var data = evt.detail;

		alertDialog.show(
			i18n_auth.AlertDialogTitle + ' ' + data.error,
			i18n_auth.UnexpectedAnswer,
			i18n_auth.CloseBtn, null,
			data.debug,
			data.id
		);

	});
});
