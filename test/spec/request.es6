import { bootstrap as bootstrapRequestModule } from '../../src/request';
import * as __ from '../../src/constants';

import { Url } from 'url'; 
import * as util from 'util'; 
import EventEmitter from 'events';

const RestServerRequest = bootstrapRequestModule();

describe('Request Server Module', () => {

    describe('properties', () => {

        describe('of a GET request', () => {
    
            var restServerRequest;
            var fakeIncomingMessage;

            beforeEach(() => {

                fakeIncomingMessage = new EventEmitter();

                Object.assign(fakeIncomingMessage, {
                    url: 'http://localhost/todos/1234?foo=bar&baz=quux',
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json',
                    },
                });

                restServerRequest = new RestServerRequest(
                    fakeIncomingMessage
                );

                restServerRequest.pathParamParser = function () { };

                let pathParams = {
                    todoId: '1234',
                };

                spyOn(restServerRequest, 'pathParamParser')
                    .and.returnValue(pathParams);

            });

            {

                let msg = 'should have the correct value for `%s`';
                let props = [
                    ['isRead', 'toBe', true],
                    ['isWrite', 'toBe', false],
                    ['isOptions', 'toBe', false],
                    ['url', 'toEqual', jasmine.any(Url)],
                    ['method', 'toBe', __.HTTP_METHOD_GET],
                    ['path', 'toBe', '/todos/1234'],
                    ['routeId', 'toBe', 'GET /todos/1234'],
                    ['queryParams', 'toEqual', jasmine.objectContaining({
                        foo: 'bar',
                        baz: 'quux',
                    })],
                ];

                props.forEach((p) => {
                    it(util.format(msg, p[0]), () => {
                        expect(restServerRequest[p[0]])[p[1]](p[2]);
                    });
                });

            }
            
        });

        describe('of a POST request', () => {
    
            var restServerRequest;
            var fakeIncomingMessage;

            beforeEach(() => {

                fakeIncomingMessage = new EventEmitter();

                Object.assign(fakeIncomingMessage, {
                    url: 'http://localhost/todos',
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                });

                restServerRequest = new RestServerRequest(
                    fakeIncomingMessage
                );

                restServerRequest.pathParamParser = function () { };

                let pathParams = {
                    todoId: '1234',
                };

                spyOn(restServerRequest, 'pathParamParser')
                    .and.returnValue(pathParams);

                var json = {
                    foo: 'bar',
                    baz: 'quux',
                };

                grow(json, 10);

                var jsonRequestBody = JSON.stringify(json);

                fakeIncomingMessage.emit(
                    'data',
                    new Buffer(jsonRequestBody, 'utf8')
                );

                fakeIncomingMessage.emit('end');

            });

            {

                let msg = 'should have the correct value for `%s`';
                let props = [
                    ['isRead', 'toBe', false],
                    ['isWrite', 'toBe', true],
                    ['isOptions', 'toBe', false],
                    ['path', 'toBe', '/todos'],
                    ['url', 'toEqual', jasmine.any(Url)],
                    ['routeId', 'toBe', 'POST /todos'],
                    ['method', 'toBe', __.HTTP_METHOD_POST],
                    ['body', 'toEqual', jasmine.objectContaining({
                        foo: 'bar',
                        baz: 'quux',
                        grown: jasmine.any(Object),
                    })],
                ];

                props.forEach((p) => {
                    it(util.format(msg, p[0]), () => {
                        expect(restServerRequest[p[0]])[p[1]](p[2]);
                    });
                });

            }
            
        });

    });

});

function grow (obj, times) {

    var times = times || 5;
    var nestingTpl = Object.create(obj);

    var lastObj = obj;
    for (let i = 0; i < times; i++) {
        lastObj = lastObj.grown = Object.create(nestingTpl);
    }

}
