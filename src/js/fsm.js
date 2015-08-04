const Machina = require('machina');

import * as teaserForm from './forms/teaser';
import * as signInForm from './forms/signIn';


const FORMS = {
    'teaserForm' : teaserForm,
    'signInForm' : signInForm
};


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
            _onEnter : loadAndGoto('teaserForm', 'teaserForm:ready')
        },

        'teaserForm:ready': {
            _onEnter  : bindAndWait('teaserForm'),
            'sign-in' : 'signInForm:loading',
            'sign-up' : 'signUpForm:loading'
        },

        'signInForm:loading': {
            _onEnter : loadAndGoto('signInForm', 'signInForm:ready')
        },

        'signInForm:ready': {
            _onEnter : bindAndWait('signInForm'),
            'back'   : 'teaserForm:loading',
            'vk'     : 'signInVKForm:loading',
            'fb'     : 'signInFBForm:loading',
            'phone'  : 'signInPhoneForm:loading'
        },
        
        'signInVKForm:loading': {
            _onEnter : noOp
        },

        'signInFBForm:loading': {
            _onEnter : noOp
        },

        'signInPhoneForm:loading': {
            _onEnter : noOp
        },

        'signUpForm:loading': {
            _onEnter : loadAndGoto('signUpForm', 'signUpForm:ready')
        },

        'signUpForm:ready': {
            _onEnter:  bindAndWait('signUpForm')
        },
        
        'globalErrorShown': {
            _onEnter: function () {
                console.error('Something bad happens...');
            }
        }
    },

    showError     : handle('globalErrorShown'),
    showTeaser    : handle('teaserForm:loading'),
    goBack        : handle('back'),
    showSignIn    : handle('sign-in'),
    showSignUp    : handle('sign-up'),
    showSignVK    : handle('vk'),
    showSignFB    : handle('fb'),
    showSignPhone : handle('phone')
});


function handle(eventName) {
    return function () { this.handle(eventName); };
}


function noOp() {}


function loadAndGoto(formID, nextState) {
    return function() {
        if (!FORMS[formID]) return;

        FORMS[formID]
            .load()
            .then(this.transition.bind(this, nextState))
            .catch(this.showError.bind(this));
    };
}


function bindAndWait(formID) {
    return function () {
        if (!FORMS[formID]) return;

        FORMS[formID]
            .bindEvents(FSM)
            .then(this.deferUntilTransition.bind(this))
            .catch(this.showError.bind(this));
    };
}

