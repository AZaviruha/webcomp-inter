require('babel/polyfill');
const Bacon   = require('baconjs');
import {FSM} from './fsm';

// console.log( 'FSM :: ', FSM );

require('domready')(function () {
    FSM.showTeaser(42);
    window.FSM = FSM;
});
