import EventEmitter from 'events';

import RestCallHandler from './rest-call-handler';

export default class RestServer extends EventEmitter {

    constructor () {

        super();

        initProps(this);

    }

}

function initProps (restServer) {

    var restCallHandler = new RestCallHandler();

}
