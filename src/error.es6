import * as util from 'util';

export function invalidPath (routeName) {
    return new Error(util.format(
        'Path for route "%s" was not specified', routeName
    ));
}

export function invalidRequestRoute (reqRouteId) {
    return new Error(util.format(
        'Invalid route "%s"', reqRouteId
    ));
}

export function serverTimedOut () {
    return newErrorMessageWithCode(
        'TIMEOUT',
        'A response was not sent within the specified time limit'
    );
}

export function badRequest (message) {
    return newErrorMessageWithCode(
        'BAD_REQUEST',
        message || 'An unknown error occurred'
    );
}

export function internal (message) {
    return newErrorMessageWithCode(
        'INTERNAL_ERROR',
        message || 'An unknown error occurred'
    );
}

export function missingRequiredParam (param) {
    return newErrorMessageWithCode(
        'MISSING_REQUIRED_PARAM',
        util.format(
            'A required parameter "%s" was missing from the request',
            param
        )
    );
}

export function unauthorized () {
    return newErrorMessageWithCode(
        'UNAUTHORIZED',
        'Invalid or insufficient privileges to perform this request'
    );
}

export function invalidAuth () {
    return newErrorMessageWithCode(
        'UNAUTHORIZED',
        'Invalid authorization'
    );
}

function newErrorMessageWithCode (code, errorMessage) {
    var error = new Error(errorMessage);
    error.code = code;
    return error;
}
