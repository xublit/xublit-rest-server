import { bootstrap as bootstrapRouteModule } from '../../src/route';

const RestServerRoute = bootstrapRouteModule();

describe('RestServerRoute', () => {

    describe('constructor(name, config)', () => {

        var route;

        beforeEach(() => {
            route = new RestServerRoute('post_some_nested_object', {
                method: 'POST',
                path: '/someObject/:anId/nestedObject',
                controller: 'SomeController:someMethod',
            });
        });

        it('should set this.name to the value of the first argument', () => {
            expect(route.name).toBe('post_some_nested_object');
        });

        it('should set this.method to the value of the corresponding attribute in the config object', () => {
            expect(route.method).toBe('POST');
        });

        it('should set this.path to the value of the corresponding attribute in the config object', () => {
            expect(route.path).toBe('/someObject/:anId/nestedObject');
        });

        it('should set the correct value for this.ctrlName', () => {
            expect(route.ctrlName).toBe('SomeController');
        });

        it('should set the correct value for this.ctrlMethodName', () => {
            expect(route.ctrlMethodName).toBe('someMethod');
        });

        it('should set the correct value for this.pathRegExp', () => {
            expect(route.pathRegExp).toEqual(jasmine.any(RegExp));
            expect(route.pathRegExp.source).toBe(
                '^POST \\/someObject\\/([A-Za-z0-9._-]+)\\/nestedObject$'
            );
        });

    });

    describe('parsePathParams(input)', () => {

        var route;
        var result;

        describe ('for a path containing named replacements', () => {

            beforeEach(() => {

                route = new RestServerRoute('post_some_nested_object', {
                    method: 'POST',
                    path: '/foo/:bar/baz/:quux/:quint',
                    controller: 'SomeController:someMethod',
                });

                result = route.parsePathParams('/foo/123/baz/456/789');

            });

            it('should return an Object', () => {
                expect(result).toEqual(jasmine.any(Object));
            });

            it('should return an Object who\'s key/value pairs match the values in the input string for the variable sections in the route path', () => {
                expect(result).toEqual(jasmine.objectContaining({
                    bar: '123',
                    quux: '456',
                    quint: '789',
                }));
            });

        });

        describe ('for a path containing a wildcard', () => {

            beforeEach(() => {

                route = new RestServerRoute('post_some_nested_object', {
                    method: 'POST',
                    path: '/foo/**/*',
                    controller: 'SomeController:someMethod',
                });

                result = route.parsePathParams('/foo/123/baz/456/789');

            });

            it('should return an Object', () => {
                expect(result).toEqual(jasmine.any(Object));
            });

            it('should return an Object with a _wildcard property who\'s value is part of the path covered by the wildcard', () => {
                expect(result).toEqual(jasmine.objectContaining({
                    _wildcard: '123/baz/456/789',
                }));
            });

        });

        describe ('for a path containing both named replacements and a wildcard', () => {

            beforeEach(() => {

                route = new RestServerRoute('post_some_nested_object', {
                    method: 'POST',
                    path: '/foo/:bar/baz/**/*/:quux/quang/:quint',
                    controller: 'SomeController:someMethod',
                });

                result = route.parsePathParams('/foo/123/baz/456/789/456/quang/789');

            });

            it('should return an Object', () => {
                expect(result).toEqual(jasmine.any(Object));
            });

            it('should return an Object with the correct properties', () => {
                expect(result).toEqual(jasmine.objectContaining({
                    bar: '123',
                    quux: '456',
                    quint: '789',
                    _wildcard: '456/789',
                }));
            });

        });

    });

});