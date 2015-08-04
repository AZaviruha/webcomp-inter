const Machina = require('machina');
const log     = require('front-log');
log.setLevel(log.LEVELS.DEBUG);

import * as teaserForm from './forms/teaser';
import * as signInForm from './forms/signIn';
import * as signUpForm from './forms/signUp';


const FORMS = {
    'teaserForm' : teaserForm,
    'signInForm' : signInForm,
    'signUpForm' : signUpForm
};


export const FSM = new Machina.Fsm({
    initialize: function (options) {
        const oldTrans = this.transition;
        this.transition = function (...args) {
            const state = (args.length > 1) && args[1] ? args[1] : args[0];
            log.debug(`FSM :: =====>> :: "${state}" state`);
            oldTrans.apply(this, args);
        };
    },

    // --------------------------------------------------- //
    initialState: 'uninitialized',

    states: {
        uninitialized: {
            '*': function (obj, appId) {
                this.deferUntilTransition();
                this.transition('teaserForm:loading', appId);
            }
        },

        // ======================= Game Teaser ================== //
        'teaserForm:loading': {
            _onEnter : loadAndGoto('teaserForm', 'teaserForm:ready')
        },

        'teaserForm:ready': {
            _onEnter  : bindAndWait('teaserForm'),
            
            /** Events **/
            'sign-in' : 'signInForm:loading',
            'sign-up' : 'signUpForm:loading'
        },

        // ======================= Sign In ====================== //
        'signInForm:loading': {
            _onEnter : loadAndGoto('signInForm', 'signInForm:ready')
        },

        'signInForm:ready': {
            _onEnter : bindAndWait('signInForm'),

            /** Events **/
            'back'  : 'teaserForm:loading',
            'vk'    : 'signInVKForm:loading',
            'fb'    : 'signInFBForm:loading',
            'phone' : 'signInPhoneForm:loading'
        },
        
        'signInVKForm:loading': {
            _onEnter : fakeLoadAndGoto('signInVKForm:ready')
        },

        'signInVKForm:ready': {
            _onEnter : noOp,

            /** Events **/
            'back'  : 'teaserForm:loading'
        },

        'signInFBForm:loading': {
            _onEnter : fakeLoadAndGoto('signInFBForm:ready')
        },

        'signInFBForm:ready': {
            _onEnter : noOp,

            /** Events **/
            'back'  : 'teaserForm:loading'
        },

        
        // ======================= Sign Up ====================== //
        'signUpForm:loading': {
            _onEnter : loadAndGoto('signUpForm', 'signUpForm:ready')
        },

        'signUpForm:ready': {
            _onEnter:  bindAndWait('signUpForm'),

            /** Events **/
            'back'  : 'teaserForm:loading',
            'vk'    : 'signUpVKForm:loading',
            'fb'    : 'signUpFBForm:loading',
            'phone' : 'signUpPhoneForm:loading'
        },

        'signUpVKForm:loading': {
            _onEnter : fakeLoadAndGoto('signUpVKForm:ready')
        },

        'signUpVKForm:ready': {
            _onEnter : noOp,

            /** Events **/
            'back'  : 'teaserForm:loading'
        },

        'signUpFBForm:loading': {
            _onEnter : fakeLoadAndGoto('signUpFBForm:ready')
        },

        'signUpFBForm:ready': {
            _onEnter : noOp,

            /** Events **/
            'back'  : 'teaserForm:loading'
        },
        
        // ======================= Errors ======================= //
        'globalErrorShown': {
            _onEnter: function () {
                console.error('Something bad happens...');
            }
        }
    },

    run           : handle('any-event-to-run-fsm'),
    showError     : handle('globalErrorShown'),
    goBack        : handle('back'),
    showSignIn    : handle('sign-in'),
    showSignUp    : handle('sign-up'),
    showSignVK    : handle('vk'),
    showSignFB    : handle('fb'),
    showSignPhone : handle('phone')
});


function handle(eventName) {
    return function (...args) { 
        log.debug(`FSM :: <<===== :: "${eventName}" event`);
        this.handle(eventName); 
    };
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


function fakeLoadAndGoto(state) {
    return function () {
        var self = this;
        setTimeout(function () { self.transition(state); }, 1000);
    };
}
