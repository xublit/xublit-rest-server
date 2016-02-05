import EventEmitter from 'events';

import * as url from 'url';

import * as __ from './constants';

const DEFAULT_REQUEST_MIME_TYPE = __.MIME_TYPE_APPLICATION_JSON;

export var name = 'RestServerRequest';
export var inject = [];
export function bootstrap () {

    class RestServerRequest extends EventEmitter {

        constructor (incomingMessage) {

            super();

            defineProperties(this, incomingMessage);

            subscribeToEvents(this, incomingMessage);

        }

    }

    return RestServerRequest;

}

function defineProperties (restServerRequest, incomingMessage) {

    var body;
    var rawBody;
    var dataReceived;
    var pathParamParser;

    var reqUrl = url.parse(incomingMessage.url);
    var reqMethod = incomingMessage.method.toUpperCase();
    var contentType = incomingMessage.headers['content-type'] ||
        DEFAULT_REQUEST_MIME_TYPE;
    
    var reqPath = reqUrl.pathname;

    Object.defineProperties(this, {

        incomingMessage: {
            value: incomingMessage,
        },

        isRead: {
            value: isReadMethod(reqMethod),
            enumerable: true,
        },

        isWrite: {
            value: isWriteMethod(reqMethod),
            enumerable: true,
        },

        isOptions: {
            value: isOptionsMethod(reqMethod),
            enumerable: true,
        },

        url: {
            value: reqUrl,
            enumerable: true,
        },

        method: {
            value: reqMethod,
            enumerable: true,
        },

        path: {
            value: reqPath,
            enumerable: true,
        },

        routeId: {
            value: util.format('%s %s', reqMethod, reqPath),
            enumerable: true,
        },

        queryParams: {
            value: parseQueryString(reqUrl),
            enumerable: true,
        },

        pathParams: {
            enumerable: true,
            get: function () {
                
                if (undefined === pathParamParser) {
                    throw new Error('Path param parser is not defined');
                }

                return pathParamParser(reqPath);

            },
        },

        body: {
            enumerable: true,
            get: function () {
                return body;
            },
            set: function (newValue) {
                if (undefined === body) {
                    body = newValue;
                }
            },
        },

        rawBody: {
            enumerable: true,
            get: function () {
                return rawBody;
            },
            set: function (newValue) {
                if (undefined === rawBody) {
                    rawBody = newValue;
                }
            },
        },

        pathParamParser: {
            enumerable: true,
            get: function () {
                return pathParamParser;
            },
            set: function (newValue) {

                if (undefined === pathParamParser) {
                    pathParamParser = newValue;
                }

            },
        },

        dataReceived: {
            enumerable: true,
            get: function () {
                return undefined === dataReceived ? false : dataReceived;
            },
            set: function (newValue) {

                if (undefined === dataReceived) {
                    pathParamParser = newValue;
                }

            },
        },

        contentType: {
            value: contentType,
            enumerable: true,
        },

    });

}

function parseRawBody (rawBody, mimeType) {

    var parsedBody;

    switch (mimeType) {

        case __.MIME_TYPE_APPLICATION_JSON:
            parsedBody = JSON.parse(rawBody);
            break;

        default:
            parsedBody = rawBody;
            break;

    }

    return parsedBody;

}

function subscribeToEvents (restServerRequest, incomingMessage) {

    var rawDataChunks = [];

    incomingMessage.on('data', (chunk) => {
        rawDataChunks.push(chunk);
    });

    incomingMessage.on('end', () => {
        
        var rawBody = rawDataChunks.join('');
        var parsedBody = parseRawBody(rawBody, restServerRequest.contentType);

        restServerRequest.body = body;
        restServerRequest.rawBody = rawBody;
        restServerRequest.dataReceived = true;

        restServerRequest.emit('received');

    });

}

function parseQueryString (url) {

    var params = {};
    var search = url.search;

    if (null === search) {
        return {};
    }

    search.substr(1).split('&').each((keyValPair) => {
        let key = keyValPair.split('=')[0];
        let val = keyValPair.split('=')[0];
        params[key] = val;
    })

    return params;

}

function isReadMethod (method) {
    return __.HTTP_READ_METHODS.indexOf(method) > -1;
}

function isWriteMethod (method) {
    return __.HTTP_WRITE_METHODS.indexOf(method) > -1;
}

function isOptionsMethod (method) {
    return __.HTTP_METHOD_OPTIONS === method;
}
