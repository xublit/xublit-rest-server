import InboundHttpMessage from './inbound-http-message';

import * as util from 'util';
import * as url from 'url';

import * as __ from './constants';

const DEFAULT_REQUEST_MIME_TYPE = __.MIME_TYPE_APPLICATION_JSON;

export default class RestServerRequest extends InboundHttpMessage {

    constructor (incomingMessage) {

        super();

        initProps(this, incomingMessage);

    }

}

function initProps (restServerRequest, incomingMessage) {

    var rawBodyChunks = [];
    var rawBody;

    var body;
    var pathParamParser;

    var bodyReceived = false;

    var reqUrl = url.parse(incomingMessage.url, true);
    var reqMethod = incomingMessage.method.toUpperCase();
    var contentType = incomingMessage.headers['content-type'] ||
        DEFAULT_REQUEST_MIME_TYPE;
    
    var reqPath = reqUrl.pathname;

    Object.defineProperties(restServerRequest, {

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

        host: {
            value: reqUrl,
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
            value: reqUrl.query,
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
        },

        rawBody: {
            enumerable: true,
            get: function () {
                return rawBody;
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

        bodyReceived: {
            enumerable: true,
            get: function () {
                return bodyReceived;
            },
        },

        contentType: {
            value: contentType,
            enumerable: true,
        },

    });

    restServerRequest.once('incomingMessage.received', function () {

    });

    incomingMessage.once('end', function () {
        
        rawBody = rawBodyChunks.join('');
        bodyReceived = true;

        restServerRequest.emit('incomingMessage.received');

    });

    incomingMessage.on('data', function (chunk) {
        rawBodyChunks.push(chunk.toString());
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
