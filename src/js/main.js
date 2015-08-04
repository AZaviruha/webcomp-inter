require('babel/polyfill');
const Bacon = require('baconjs');

import {FSM} from './fsm';

require('domready')(function () {
    FSM.showTeaser();
    window.FSM = FSM;
});
