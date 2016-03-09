import HttpMessage from './http-message';
import OutboundHttpMessageHeaders from './outbound-http-message-headers';

export default class OutboundHttpMessage extends HttpMessage {

    constructor (serverResponse) {

        super();

        initProps(this, serverResponse);

    }

}

function initProps (outboundHttpMessage, serverResponse) {

    var headers = new OutboundHttpMessageHeaders();

}
