import * as __ from './constants';

import OutboundHttpMessage from './outbound-http-message';

const DEFAULT_RESPONSE_MIME_TYPE = __.MIME_TYPE_APPLICATION_JSON;
const DEFAULT_RESPONSE_ENCODING = __.ENCODING_UTF_8;

export default class RestServerResponse extends OutboundHttpMessage {

    constructor (serverResponse) {

        super(serverResponse);

        defineProperties(this, serverResponse);

        bindEventListeners(this, serverResponse);

    }

    static applyDefaultHeaders (responseHeaders) {

        // var requestOrigin = incomingMessage.headers.origin || '*';

        var allowHeaders = [
            __.HTTP_HEADER_ACCEPT,
            __.HTTP_HEADER_ACCEPT_VERSION,
            __.HTTP_HEADER_CONTENT_TYPE,
        ];

        var allowMethods = __.ALL_HTTP_METHODS;

        return Object.assign(responseHeaders, {

            'Server': __.OUTBOUND_SERVER_HEADER,

            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': allowMethods.join(', '),
            'Access-Control-Allow-Headers': allowHeaders.join(', '),
            'Access-Control-Allow-Credentials': true,

            'Keep-Alive': 'timeout=2, max=100',
            'Connection': 'Keep-Alive',

        });

    }

    formatBody (body) {

        var formattedBody;

        switch (this.contentType) {

            case __.MIME_TYPE_APPLICATION_JSON:
                formattedBody = JSON.stringify(body);
                break;

            default:
                formattedBody = body;
                break;

        }

        return formattedBody;

    }

    send (body, statusCode) {

        this.body = body || '';
        this.statusCode = statusCode || 200;

        writeHead(this);

        if (this.body) {
            writeBody(this);
        }

        this.serverResponse.end(() => {

        });

    }

}

function defineProperties (restServerResponse, serverResponse) {

    var body;
    var statusCode;
    var connectionClosed;

    var encoding = DEFAULT_RESPONSE_ENCODING;
    var contentType = DEFAULT_RESPONSE_MIME_TYPE;

    function headersSent () {
        return serverResponse.headersSent;
    }

    function responseFinished () {
        return serverResponse.finished;
    }

    Object.defineProperties(restServerResponse, {

        serverResponse: {
            value: serverResponse,
        },

        headers: {
            enumerable: true,
            get: function () {
            
                var contentType = util.format(
                    '%s; charset=%s',
                    restServerResponse.contentType,
                    restServerResponse.encoding
                );

                return RestServerResponse.applyDefaultHeaders({
                    'Content-Type': contentType,
                    'Content-Length': restServerResponse.contentLength,
                });

            },
        },

        body: {
            enumerable: true,
            get: function () {
                return body;
            },
            set: function (newValue) {

                if (responseFinished()) {
                    throw new Error(
                        'Can\'t set response body after it has been sent'
                    );
                }

                body = parseBody(
                    restServerResponse.formatBody(newValue),
                    restServerResponse.encoding
                );

            }
        },

        statusCode: {
            enumerable: true,
            get: function () {
                return statusCode;
            },
            set: function (newValue) {

                if (headersSent()) {
                    throw new Error(
                        'Can\'t set response status code - headers already sent'
                    );
                }

                statusCode = newValue;

            }
        },

        encoding: {
            enumerable: true,
            get: function () {
                return encoding;
            },
            set: function (newValue) {

                if (headersSent()) {
                    throw new Error(
                        'Can\'t set response encoding - headers already sent'
                    );
                }

                encoding = newValue;

            },
        },

        contentType: {
            enumerable: true,
            get: function () {
                return contentType;
            },
            set: function (newValue) {

                if (headersSent()) {
                    throw new Error(
                        'Can\'t set response contentType - headers already sent'
                    );
                }

                contentType = newValue;

            },
        },

        contentLength: {
            enumerable: true,
            get: function () {

                var content = restServerResponse.body;

                if (!content) {
                    return 0;
                }

                if (Buffer.isBuffer(content)) {
                    return content.length;
                }

                return Buffer.byteLength(
                    content,
                    restServerResponse.charset
                );
                
            }
        },

        headersSent: {
            enumerable: true,
            get: function () {
                return headersSent();
            },
        },

        connectionClosed: {
            enumerable: true,
            get: function () {
                return connectionClosed || false;
            },
            set: function (newValue) {
                
                if (true !== newValue) {
                    return;
                }

                if (undefined === connectionClosed) {
                    connectionClosed = newValue;
                }

            },
        },

    });

}

function bindEventListeners (restServerResponse, serverResponse) {

    serverResponse.once('close', () => {
        restServerResponse.connectionClosed = true;
        restServerResponse.emit('connectionLost');
    });

    serverResponse.once('finish', () => {
        restServerResponse.connectionClosed = true;
        restServerResponse.emit('sent');
    });

}

function writeHead (restServerResponse) {

    if (true === restServerResponse.headersSent) {
        throw new Error('Can\'t write request headers - headers already sent')
    }

    restServerResponse
        .serverResponse
        .writeHead(restServerResponse.statusCode, restServerResponse.headers);

}

function writeBody (restServerResponse) {
    
    restServerResponse
        .serverResponse
        .write(restServerResponse.body);

}

function parseBody (body, encoding) {

    if (Buffer.isBuffer(body)) {
        return body;
    }

    if ('string' === typeof body) {
        return new Buffer(body, encoding);
    }

    throw new TypeError('`body` must be a string or instance of Buffer');

}
