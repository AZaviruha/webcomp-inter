define(['events', 'libs/domready'], function (events, domReady) {
	// Basic object in case there's no needed HTML
	var alertDialog = {
		show: function(title, message, buttonText, buttonMethod, debug) {
			alert(title + '\n\n' + message);
		}
	}

	domReady(function () {
		// looking for the HTML
		alertDialog.overlayBlock = document.querySelector('.Overlay');

    	// if there's any .Content element on page – move Overlay there for correct positioning
    	var contentBlock = document.querySelector('.Content');
    	if (contentBlock) {
	    	contentBlock.appendChild(alertDialog.overlayBlock);
    	}

		if (alertDialog.overlayBlock) {
	    	alertDialog.alertBlock = alertDialog.overlayBlock.querySelector('.Alert');
	    	
	    	alertDialog.title = alertDialog.overlayBlock.querySelector('.Alert--Title');
	    	alertDialog.defaultTitle = alertDialog.title.innerHTML;
	    	alertDialog.message = alertDialog.overlayBlock.querySelector('.Alert--Message');
	    	alertDialog.button = alertDialog.overlayBlock.querySelector('.Button');
	    	alertDialog.defaultButton = alertDialog.button.innerHTML;
	    	alertDialog.action = null;

	    	alertDialog.debug = alertDialog.overlayBlock.querySelector('.Alert--Debug');
	    	alertDialog.debugTrigger = alertDialog.overlayBlock.querySelector('.Alert--DebugTrigger');
	    	alertDialog.debugTriggerArrow = alertDialog.overlayBlock.querySelector('.Alert--DebugTriggerArrow');
	
	
			alertDialog.show = function(title, message, buttonText, buttonAction, debug, dialogId) {
				alertDialog.title.innerHTML = title || alertDialog.defaultTitle;
				alertDialog.message.innerHTML = message;
				alertDialog.button.innerHTML = buttonText || alertDialog.defaultButton;
				alertDialog.action = buttonAction;
				if (dialogId) {
					alertDialog.alertBlock.id = dialogId;
				}
				
				alertDialog.overlayBlock.classList.add('Overlay-State-visible');
				
				if (debug) {
					var debugStr = '';
					for (var i in debug) {
						debugStr += i + ': <span id="qa-' + i + '">' + debug[i] + '</span><br>';
					}
					alertDialog.debug.innerHTML = debugStr;
					alertDialog.debugTrigger.classList.add('Alert--DebugTrigger-State-visible');
				} else {
					alertDialog.debugTrigger.classList.remove('Alert--DebugTrigger-State-visible');
				}
			}
			
			alertDialog.close = function() {
				var result;
				if (alertDialog.action) {
					result = alertDialog.action();
					alertDialog.action = null;
				}
				alertDialog.alertBlock.id = '';
				if (result !== false) {
					alertDialog.overlayBlock.classList.remove('Overlay-State-visible');
				}
			}

			alertDialog.dismiss = function() {
				alertDialog.overlayBlock.classList.remove('Overlay-State-visible');
				events.trigger('form-hide-spinners');
			}

			// expand/collapse debug info box
			alertDialog.triggerDebugInfo = function() {
				alertDialog.debug.classList.toggle('Alert--Debug-State-visible');
				alertDialog.debugTriggerArrow.classList.toggle('Alert--DebugTriggerArrow-Position-close');
			}
			
			// Event handlers
			events.handle('click', alertDialog.button, alertDialog.close);
			events.handle('click', alertDialog.alertBlock, function(evt) {
				evt.stopPropagation();
			});
			events.handle('click', alertDialog.overlayBlock, alertDialog.dismiss);
			events.handle('click', '.Alert--DebugTrigger', alertDialog.triggerDebugInfo);
		}
	});

    return alertDialog;
});