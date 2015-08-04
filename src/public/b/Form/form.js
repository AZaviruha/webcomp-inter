define(['events', 'libs/domready', 'auth'], function(events, domReady, auth) {
	function Form(formEl) {
	
		var formInputs = formEl.querySelectorAll('input, select, textarea');
		var captchaBlock = formEl.querySelector('.Form--HiddenBlock[data-type=captcha]');
		var captchaRefresh = formEl.querySelector('.Input--CaptchaHolder');
		var captchaVisible = false;
	
		// Capturing events
		  // form submit
		events.handle('submit', formEl, formSubmit);
		  // form inputs keyup and blur
		events.handle('blur', formInputs, checkInputValue);
		  // captcha refresh arrows
		if (captchaRefresh) {
			captchaRefresh.addEventListener('click', refreshCaptcha, false);
		}
		  // global events
		document.addEventListener('form-error', handleFormErrorEvent, false);
		  // show captcha (maybe we should make it a 'form' event too)
		document.addEventListener('form-show-captcha', showCaptcha, false);
		document.addEventListener('form-refresh-captcha', checkAvailabilityAndRefreshCaptcha, false);
		document.addEventListener('form-hide-captcha', hideCaptcha, false);
		  // clear all spinners on the page
		document.addEventListener('form-hide-spinners', hideSpinners, false);

		  // check for captcha
		  // one time on form init
		if (formEl.getAttribute('data-rate-limit-check')) {
			events.trigger('rate-limit-check', { uri: formEl.getAttribute('data-rate-limit-check') });
		}

		// Submitting the form means check for all the inputs
		// and if everything is ok, then send custom event to the document
		// the type of the custom event is from the data-event attribute
		// and additional data is names and values of all the active inputs
		function formSubmit(evt) {
			evt.preventDefault();

			// Cheking the active inputs values
			var inputs = formEl.querySelectorAll('.Input');
			var validated = true;
			for (var i = 0, len = inputs.length; i < len; i++) {
				if (isInputActive(inputs[i])) {
					if (!checkInputValue(null, inputs[i])) {
						validated = false;
					}
				}
			}

			// if there's no error, then submit the form
			if (validated) {
				// gather data
				var data = {};
				for (var i = 0, len = formInputs.length; i < len; i++) {
					if (isInputActive(formInputs[i])) {
						data[formInputs[i].id] = formInputs[i].value;
					}
				}
				// create custom event
				var action = formEl.getAttribute('data-event');
				if (action) {
					events.trigger(action, data);
				}

				// turn on spinner in the button if it's available
				if (formEl.classList.contains('Form-ButtonSpin-true')){
					var buttons = formEl.querySelectorAll('button.Button');
					for (var i = 0, len = buttons.length; i < len; i++) {
						buttons[i].classList.add('Button-State-spinner');
					}
				}
			}
		}
	
		function isInputActive(input) {
			if (input.hasAttribute('data-active-if')) {
				var activeIf = input.getAttribute('data-active-if');
				if (activeIf.indexOf('#') === 0) {
					// element activity depends on other element activity
					return isInputActive(document.getElementById(activeIf.substr(1)));
				} else {
					// check all the predefined values
					switch (activeIf) {
						case "not-empty":
							if (input.value.length === 0) {
								return false;
							} else {
								return true;
							}
						default: return true;
					}
				}
			} else {
				return true;
			}
		}
	
		// Checking input value against pattern attribute
		// and displaying an error in case of mismatch
		function checkInputValue(evt, input) {
			var input = input || evt.target;
			var block = input.parentNode;
			var value = input.value;
	
			// Clear any parent error
			if (block.parentNode.classList.contains('Input--ErrorBlock-Active')) {
				clearErrors(block.parentNode);
			}

			if (input.hasAttribute('data-remove')) {
				var removePattern = new RegExp(input.getAttribute('data-remove'), 'g');
				input.value = input.value.replace(removePattern, '');
			}
	
			if (value.length === 0) {
				// if there is no value, than there is no error
				//... if the field is not required
				if (input.hasAttribute('required')) {
					showError(block, 'empty');
					return false;
				}
			} else if (input.hasAttribute('pattern')) {
				// if element have pattern attribute – check the value agains it
				var pattern = new RegExp(input.getAttribute('pattern'));
				// prepare some values for testing
				var value = input.value;
				if (!pattern.test(value)) {
					// if value didn't match the pattern – showing the pattern error
					showError(block, 'pattern');
					return false;
				}
			}
			clearErrors(block);
			return true;
		}
	
		// Showing error for the whole error block
		// it may contain several inputs, and all of them should be marked as wrong
		// Error messages are diplayed only for the specified error type
		// If there already are errors, then nothing happens with 
		function showError(block, type) {
			if (formEl) {
				formEl.classList.add('Form--Fieldset-Error');
			}
			// hide all error messages but the right type
			if (block.classList.contains('Input--ErrorBlock')) {
				// mark error block as active
				block.classList.add('Input--ErrorBlock-Active');
				
				var typeRE = new RegExp('(^|\\s)' + type + '($|\\s)');
				// all internal error messages
				var errorMsgs = block.querySelectorAll('.Input--ErrorMsg');
				for (var i = 0, len = errorMsgs.length; i < len; i++) {
					var msgEl = errorMsgs[i];
					var msgErrorTypes = msgEl.getAttribute('data-error-type');
					if (typeRE.test(msgErrorTypes)) {
						// show message
						msgEl.classList.add('Input--ErrorMsg-Visible');
					} else {
						// hide message
						msgEl.classList.remove('Input--ErrorMsg-Visible');
					}
				}
				// add error class to the inputs
				var inputs = block.querySelectorAll('.Input');
				for (var i = 0, len = inputs.length; i < len; i++) {
					inputs[i].classList.add('Input-Error');
					inputs[i].addEventListener('input', checkInputValue, false);
				}
				
			}
		}
	
		function clearErrors(block) {
			if (formEl) {
				formEl.classList.remove('Form--Fieldset-Error');
			}
			// check for parent error block
			if (block.classList.contains('Input--ErrorBlock')) {
				// 
				block.classList.remove('Input--ErrorBlock-Active');
			
				// hide all error messages
				var errorMsgs = block.querySelectorAll('.Input--ErrorMsg');
				for (var i = 0, len = errorMsgs.length; i < len; i++) {
					errorMsgs[i].classList.remove('Input--ErrorMsg-Visible');
				}
				// remove error class from inputs
				var inputs = block.querySelectorAll('.Input');
				for (var i = 0, len = inputs.length; i < len; i++) {
					inputs[i].classList.remove('Input-Error');
					inputs[i].removeEventListener('input', checkInputValue, false);
				}
			}
		}
	
	
		function handleFormErrorEvent(evt) {
			// error type
			var type = evt.detail;
			var errorMsg = formEl.querySelector('.Input--ErrorMsg[data-error-type=' + type + ']');
			if (errorMsg) {
				showError(errorMsg.parentNode, type);
			}
			checkAvailabilityAndRefreshCaptcha();
		}
	
	
		// Captcha methods
		function showCaptcha(evt) {
			var type = evt.detail;
			if (captchaBlock) {
				refreshCaptcha();
				captchaBlock.classList.add('Form--HiddenBlock-Visible');
				if (!type || type != 'initial') {
					showError(captchaBlock, (captchaVisible)? 'invalid-captcha' : 'enter-captcha');
				}
				captchaVisible = true;
				// focus on captha input to keep keyboard visible
				var captchaInput = formEl.querySelector('.Input-Type-captcha');
				if (captchaInput && (!type || type != 'initial')) {
					captchaInput.focus();
				}
			}
		}
		function hideCaptcha(evt) {
			if (captchaBlock) {
				captchaBlock.classList.remove('Form--HiddenBlock-Visible');
				clearErrors(captchaBlock);
				captchaVisible = false;
			}
		}
		
		function checkAvailabilityAndRefreshCaptcha() {
			if (captchaVisible) {
				refreshCaptcha();
			}
		}
		
		function refreshCaptcha() {
			if (captchaBlock) {
				var captchaImg = captchaBlock.querySelector('.Input--CaptchaImage');
				var captchaRefreshBtn = captchaBlock.querySelector('.Input--CaptchaRefresh');
				if (captchaRefreshBtn) {
					captchaImg.addEventListener('load', stopCaptchaRefreshButton, false);
					captchaRefreshBtn.classList.add('Input--CaptchaRefresh-Spin');
				}
				var maxInt = 9007199254740992;
				var captchaId = Math.floor(Math.random()*maxInt);
				var captchaImgUrl = api.getUrl("/captcha/"+captchaId+"?background=15790320");
				
				document.getElementById('captcha-id').value = captchaId;
				document.getElementById('captcha-value').value = '';
				captchaImg.src = captchaImgUrl;
			}
		}
		function stopCaptchaRefreshButton() {
			if (captchaBlock) {
				var captchaImg = captchaBlock.querySelector('.Input--CaptchaImage');
				captchaImg.removeEventListener('load', stopCaptchaRefreshButton, false);
				var captchaRefreshBtn = captchaBlock.querySelector('.Input--CaptchaRefresh');
				if (captchaRefreshBtn) {
					captchaRefreshBtn.classList.remove('Input--CaptchaRefresh-Spin');
				}
			}
		}
	
	
	
		function hideSpinners() {
			var spinButtons = document.querySelectorAll('.Button-State-spinner');
			for (var i = 0, len = spinButtons.length; i < len; i++) {
				spinButtons[i].classList.remove('Button-State-spinner');
			}
		}
	}


	var forms = [];
	domReady(function() {
		forms = document.querySelectorAll('form');
		for (var i = 0, len = forms.length; i < len; i++) {
			new Form(forms[i]);
		}
	});
	
	return forms;
});
