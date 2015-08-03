const Machina = require('machina');

import * as teaserForm from '../forms/teaser';
import * as signInForm from '../forms/signIn';

export const FSM = new Machina.Fsm({
    initialize: function (options) {
        console.log( 'fsm :: initialize() :: ', options );
    },

    initialState: 'uninitialized',

    states: {
        uninitialized: {
            '*': function (obj, appId) {
                this.deferUntilTransition();
                this.transition('teaserForm:loading', appId);
            }
        },

        'teaserForm:loading': {
            _onEnter : loadTeaserForm
        },

        'teaserForm:ready': {
            _onEnter  : bindTeaserForm,
            'sign-in' : 'signInForm:loading',
            'sign-up' : 'signUpForm:loading'
        },

        'signInForm:loading': {
            _onEnter: loadSignInForm
        },

        'signInForm:ready': {
            _onEnter : bindSignInForm,
            'back'   : 'teaserForm:loading',
            'vk'     : 'signInVKForm:loading',
            'fb'     : 'signInFBForm:loading',
            'phone'  : 'signInPhoneForm:loading'
        },

        'signUpForm:loading': {
            _onEnter: loadSignUpForm
        },

        'signUpForm:ready': {
            _onEnter : bindSignUpForm
        },
        
        'globalErrorShown': {
            _onEnter: function () {
                console.error('Something bad happens...');
            }
        }
    },

    showError: function (err) {
        console.error('Error :: ', err);
        this.handle('globalErrorShown');
    },

    showTeaser: function (appId) {
        console.log('fsm :: showTeaser() :: ', arguments);
        this.handle('teaserForm:loading', appId);
    },

    goBack: function () {
        console.log('goBack() starts...');
        this.handle('back');
    },

    showSignIn: function () {
        this.handle('sign-in');
    },

    showSignUp: function () {
        this.handle('sign-up');
    },

    showSignVK: function () {
        this.handle('vk');
    },

    showSignFB: function () {
        this.handle('fb');
    },

    showSignPhone: function () {
        this.handle('phone');
    }
});



function loadTeaserForm() {
    console.log('loadTeaserForm() starts...');
    teaserForm
        .load(42)
        .then(this.transition.bind(this, 'teaserForm:ready'))
        .catch(this.showError.bind(this));
}


function bindTeaserForm() {
    console.log('bindTeaserForm() starts...');
    teaserForm
        .bindEvents(FSM)
        .then(this.deferUntilTransition.bind(this))
        .catch(this.showError.bind(this));
}


function loadSignInForm () {
    console.log('loadSignInForm() starts...');
    signInForm
        .load()
        .then(this.transition.bind(this, 'signInForm:ready'))
        .catch(this.showError.bind(this));
}


function bindSignInForm() {
    console.log('bindSignInForm() starts...');

    signInForm
        .bindEvents(FSM)
        .then(this.deferUntilTransition.bind(this))
        .catch(this.showError.bind(this));
}


function loadSignUpForm() {}

function bindSignUpForm() {}
