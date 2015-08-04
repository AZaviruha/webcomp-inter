require('babel/polyfill');
const Bacon = require('baconjs');

import {FSM} from './fsm';

require('domready')(function () {
    FSM.run();
    window.FSM = FSM;
});
