import * as util from 'util';
import * as error from './error';

export var ref = 'RestServerRoute';
export var inject = [];
export function bootstrap () {

    class RestApiRoute {

        constructor (routeName, config) {

            config = config || {};

            if (!config.path) {
                throw error.invalidPath(routeName);
            }

            this.name = routeName;

            this.method = config.method || 'GET';
            this.path = config.path;
            this.ctrlName = getControllerName(config.controller);
            this.ctrlMethodName = getControllerMethodName(config.controller);

            this.pathRegExp = RestApiRoute.createPathRegExp(
                this.method,
                this.pathParts
            );

        }

        static createPathRegExp (method, pathParts) {

            var regExpParts = [];

            var finalParts = pathParts.map(parsePathPart);
            finalParts.forEach((finalPart) => {

                if (undefined === finalPart || null === finalPart) {
                    return;
                }

                regExpParts.push(finalPart);

            });

            return new RegExp(util.format(
                '^%s /%s$', method, regExpParts.join('/')
            ));

        }

        get pathParts () {
            return this.path.substr(1).split(/\//);
        }

        parsePathParams (input) {

            var pathParams = {};
            var patternParts = this.pathParts;
            var inputPathParts = input.substr(1).split(/\//);

            {

                let wildcardIndex = patternParts.indexOf('**');
                let nextIndex = wildcardIndex + 1;

                if (wildcardIndex > -1) {
                    if ('*' === patternParts[nextIndex]) {
                        patternParts.splice(nextIndex, 1);
                    }
                }

            }

            for (let i = 0; i < patternParts.length; i++) {

                let key = patternParts[i];
                let value;

                if ('**' === key.substr(0, 2)) {
                    let x = inputPathParts.length - patternParts.length + 1;
                    pathParams._wildcard = inputPathParts.splice(i, x, '').join('/');
                    continue;
                }

                if (':' !== key.substr(0, 1)) {
                    continue;
                }

                key = key.substr(1);
                value = inputPathParts[i];

                pathParams[key] = value;

            }

            return pathParams;

        }

    }

    return RestApiRoute;

}

function parsePathPart (pathPart) {

    if (':' === pathPart.substr(0, 1)) {
        return '([A-Za-z0-9._-]+)';
    }

    if ('**' === pathPart.substr(0, 2)) {
        return '([A-Za-z0-9\\/._-]+)';
    }

    if ('*' === pathPart.substr(0, 1)) {
        return;
    }

    return pathPart;

}

function getControllerName (ctrlConfig) {
    return ctrlConfig.split(':')[0];
}

function getControllerMethodName (ctrlConfig) {
    return ctrlConfig.split(':')[1];
}
