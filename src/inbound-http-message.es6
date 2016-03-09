import HttpMessage from './http-message';
import InboundHttpMessageHeaders from './inbound-http-message-headers';

export default class InboundHttpMessage extends HttpMessage {

    constructor (incomingRequest) {

        super();

        initProps(this, incomingRequest);

    }

}

function initProps (inboundHttpMessage, incomingRequest) {

    var headers = new InboundHttpMessageHeaders();
    
}
