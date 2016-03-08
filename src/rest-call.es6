import * as url from 'url';
import * as util from 'util';
import * as uuid from 'node-uuid';

import RestServerRequest from './rest-server-request';
import RestServerResponse from './rest-server-response';

import * as error from './error';
import * as __ from './constants';

const DEFAULT_TIMEOUT_MS = 20000; // 20 seconds

export default class RestApiCall {

    constructor (handler, incomingMessage, serverResponse) {

        var request = new RestServerRequest(incomingMessage);
        var response = new RestServerResponse(serverResponse);

        defineProperties(this, handler, request, response);

        bindEventListeners(this);

    }

    static uuid () {
        return uuid.v4();
    }

    get rawRequestBody () {
        return this.request.rawBody;
    }

    get params () {
        return _.extend(
            {},
            this.__requestBody || {},
            this.__queryParams || {}
        );
    }

    get responseHeaders () {

        var defaultHeaders = RestApiCall.defaultHeaders(
            this.__incomingMessage
        );

        return _.extend({}, defaultHeaders, this._responseHeaders);

    }

    set responseContentType (newValue) {
        this._responseHeaders['Content-Type'] = newValue;
    }

    get responseContentType () {
        return this.responseHeaders['Content-Type'];
    }

    // hasReqBody () {
    //     return '' !== this.rawRequestBody;
    // }

    __setupAuthContext () {

    }

    __addEventListeners () {

    }

    /**
     * Response methods
     */

    respond (statusCode, body) {
        return this.response.send(body, statusCode);
    }

    responseTimeout () {
        this.respond(__.HTTP_STATUS_INTERNAL_ERROR, error.serverTimedOut());
    }

    respondInvalidAuth () {
        this.respond(__.HTTP_STATUS_BAD_REQUEST, error.invalidAuth());
    }

    respondUnauthorised () {
        this.respond(__.HTTP_STATUS_BAD_REQUEST, error.unauthorized());
    }

    respondSuccess (body) {
        this.respond(__.HTTP_STATUS_OK, body);
    }

    respondAccepted (body) {
        this.respond(__.HTTP_STATUS_ACCEPTED, body || undefined);
    }

    respondNotFound () {
        this.respond(__.HTTP_STATUS_NOT_FOUND);
    }

    respondNoContent () {
        this.respond(__.HTTP_STATUS_NO_CONTENT);
    }

    respondBadRequest (err) {
        this.respond(
            __.HTTP_STATUS_BAD_REQUEST,
            error.badRequest(err.message)
        );
    }

    respondInternalError (err) {
        this.respond(
            __.HTTP_STATUS_INTERNAL_ERROR,
            error.internal(err.message)
        );
    }

    assertHasParam (paramPath) {

        var hasParam = this.deepExists(['params', paramPath].join('.'));
        if (!hasParam) {
            throw $e.newError(
                ERROR_MESSAGE_MISSING_REQUIRED_PARAM,
                paramPath
            );
        }

    }

    getPathParam (paramName) {
        return paramName in this.request.pathParams ?
            this.request.pathParams[paramName] :
            undefined;
    }

    getParam (paramPath) {
        return this.deepFind(['params', paramPath].join('.'));
    }

    getRequiredParam (paramPath) {
        this.assertHasParam(paramPath);
        return this.deepFind(['params', paramPath].join('.'));
    }

    getContextParam (param) {
        return param in this.context ? this.context[param] : undefined;
    }

    buildObjectUsing (paramPaths) {

        var object = {};

        if ('contextParams' in paramPaths) {
            addContextParamsToObject(this, paramPaths.contextParams, object, {
                // omitUndefined: true
            });
        }

        if ('requestParams' in paramPaths) {
            addRequestParamsToObject(this, paramPaths.requestParams, object, {
                // omitUndefined: true
            });
        }

        return object;

    }

}

function done (restServerCall) {

    if (restServerCall.__timeout) {
        clearTimeout(restServerCall.__timeout);
    }

    restServerCall.emit('done');

}

function defineProperties (restServerCall, handler, request, response) {

    var reqRouteId = restServerRequest.routeId;
    var restServerRoute = handler.findRouteForReqRouteId(reqRouteId);

    if (!restServerRoute && !restServerRequest.isOptions) {
        throw error.invalidRequestRoute(reqRouteId);
    }

    restServerRequest.pathParamParser = restServerRoute.parsePathParams;

    Object.defineProperties(restServerCall, {

        id: {
            value: RestApiCall.uuid(),
            enumerable: true,
        },

        request: {
            value: restServerRequest,
            enumerable: true,
        },

        response: {
            value: restServerResponse,
            enumerable: true,
        },

        route: {
            value: restServerRoute,
            enumerable: true,
        },

        __timeout: {
            value: null,
            writable: true,
        },

    });

}

function bindEventListeners (restServerCall) {

    restServerCall.on('ready', () => {

        restServerCall.__timeout = setTimeout(() => {
            restServerCall.emit('timeout');
            restServerCall.responseTimeout();
        }, DEFAULT_TIMEOUT_MS);

        if (true === restServerCall.context.verified) {
            restServerCall.emit('contextVerified');
            return;
        }

        restServerCall.respondInvalidAuth();

    });

    restServerCall.context.on('verificationComplete', () => {
        if (true === restServerCall.__incomingDataReceived) {
            restServerCall.emit('ready');
        }
    });

    restServerCall.response.on('connectionLost', () => {
        restServerCall.emit('terminate');
        done(restServerCall);
    });

    restServerCall.response.on('sent', () => {
        done(restServerCall);
    });

    restServerCall.request.on('received', () => {

        restServerCall.emit('finishedReceivingRequest');

        if (restServerCall.context.verificationComplete) {
            restServerCall.emit('ready');
        }

    });

}

function addContextParamsToObject (apiCall, contextParams, object, options) {

    var omitUndefined = options && 'omitUndefined' in options
        ? options.omitUndefined
        : false;

    _.each(contextParams, function (param) {

        param = /\=/.test(param) ? param.split(/\=/) : [ param, param ];

        var origParamName = param[0];
        var newParamName = param[1];

        var value = apiCall.getContextParam(origParamName);

        if (undefined === value && omitUndefined) {
            return;
        }

        object[newParamName] = value;

    });

}

function addRequestParamsToObject (apiCall, requestParamPaths, object, options) {

    var omitUndefined = options && 'omitUndefined' in options
        ? options.omitUndefined
        : false;

    var requiredParamPaths = requestParamPaths.required || [];
    var optionalParamPaths = requestParamPaths.optional || [];

    _.each(requiredParamPaths, function (paramPath) {
        var value = apiCall.getRequiredParam(paramPath);
        deepSet(object, paramPath, value);
    });

    _.each(optionalParamPaths, function (paramPath) {

        var value = apiCall.getParam(paramPath);

        if (undefined === value && omitUndefined) {
            return;
        }

        deepSet(object, paramPath, value);

    });

}

function deepFind (obj, path) {

    if (!path.match(/\./)) {
        return obj[path];
    }

    var pathParts = path.split('.');
    var current = obj;

    for (var i = 0; i < pathParts.length; i++) {

        if (undefined === current[pathParts[i]]) {
            return undefined;
        }

        current = current[pathParts[i]];

    }

    return current;

}

function deepSet (obj, path, value) {

    var pathParts = path.split('.');
    var key = pathParts.splice(-1);
    var current = obj;

    for (var i = 0; i < pathParts.length; i++) {

        if (undefined === current[pathParts[i]]) {
            current[pathParts[i]] = {};
        }

        var isObject = current[pathParts[i]] instanceof Object;
        if (!isObject) {
            return false;
        }

        current = current[pathParts[i]];

    }

    current[key] = value;

    return true;

}