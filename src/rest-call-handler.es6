import EventEmitter from 'events';

import RestCall from './rest-call';

const ERROR_MESSAGE_INVALID_ROUTE = '[INVALID_ROUTE] No such route exists: %s';

export default class RestServerCallHandler extends EventEmitter {

    constructor (restServer) {

        super();

        this.restServer = restServer;

        this.activeCalls = new Map();

    }

    get numActiveCalls () {
        return this.activeCalls.size();
    }

    handle (incomingMessage, serverResponse) {

        var apiCall = new RestCall(
            this,
            incomingMessage,
            serverResponse
        );

        apiCall.on('done', () => {
            this.finish(apiCall);
        });

        apiCall.on('contextVerified', () => {
            this.execute(apiCall);
        });

        this.addActiveCall(apiCall);

    }

    execute (apiCall) {

        try {

            var route = apiCall.route;

            if (undefined === route) {
                throw $e.newError(
                    ERROR_MESSAGE_INVALID_ROUTE,
                    apiCall.reqRoute
                );
            }

            var ctrlName = route.ctrlName;
            var ctrlMethodName = route.ctrlMethodName;

            var routeController = this.restHttpApi.getRouteController(
                ctrlName
            );
            var routeControllerMethod = routeController[ctrlMethodName];

            routeControllerMethod(apiCall);

        }
        catch (error) {

            switch (error.errorType) {

                case 'INVALID_ROUTE':
                    apiCall.respondNotFound();
                    break;

                default:
                    $logger.error(error);
                    apiCall.respondInternalError(error);
                    break;

            }

        }

    }

    finish (apiCall) {
        this.removeActiveCall(apiCall);
    }

    addActiveCall (apiCall) {
        this.activeCalls.set(apiCall.__id, apiCall);
    }

    removeActiveCall (apiCall) {
        this.activeCalls.delete(apiCall.__id);
    }

    findRouteForReqRouteId (reqRouteId) {
        return this.restServer.findRouteForReqRouteId(reqRouteId);
    }

}
