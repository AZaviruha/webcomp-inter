require(['/b/GameTeaser/flipsnap.min.js'], function(Flipsnap) {
    window.flipsnap = Flipsnap('.GameTeaser--Gallery');
    var flipsnapPointsContainer = document.querySelector('.GameTeaser--FramePointers'),
    	flipsnapPoints = document.querySelectorAll('.GameTeaser--FramePointer'),
    	flipsnapLastPoint = 0;

    flipsnap.element.addEventListener('fspointmove', function(evt, data) {
		flipsnapPointsContainer.classList.remove('GameTeaser--FramePointers-Active-' + flipsnapLastPoint);
		flipsnapLastPoint = flipsnap.currentPoint;
		flipsnapPointsContainer.classList.add('GameTeaser--FramePointers-Active-' + flipsnapLastPoint);
		flipsnapLastPoint = flipsnap.currentPoint;
    	for (var i = 0, len = flipsnapPoints.length; i < len; i++) {
    		if (i === flipsnap.currentPoint) {
    			flipsnapPoints[i].classList.add('GameTeaser--FramePointer-State-current');
    		} else {
    			flipsnapPoints[i].classList.remove('GameTeaser--FramePointer-State-current');
    		}
    	}
    	
    	// Ya.Metrika goal
    	if (window.yaCounter29569575) {
	    	yaCounter29569575.reachGoal('screen-flip');
    	}
    });
    
    document.addEventListener('orientationchange', function(evt) {
    	if (window.flipsnap) {
    		flipsnap.refresh();
    	}
    });
    window.addEventListener('resize', function(evt) {
    	if (window.flipsnap) {
    		flipsnap.refresh();
    	}
    });
});
