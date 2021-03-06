// I hate making wheels
var MockExpress = function(route) {
	var express = require('express'),
		extend = require('extend'),
		URL = require('url'),
		qs = require('querystring'),
		router = new express.Router(),
		sideEffects = { session: {}, model: {} },
		defaultRequest, defaultResponse;


	// limited subset for now
	return {
		'get': function() { router.get.apply(router, Array.prototype.slice.apply(arguments)); },
		'post': function() { router.post.apply(router, Array.prototype.slice.apply(arguments)); },
		'invoke': function(method, path, req, res, next) {
			req = extend(req || defaultRequest || {}, { params: {} });
			res = extend(res || defaultResponse || {}, {});

			req.query = qs.parse(URL.parse(path).query);

			// only the first one. This is just for unit testing
			var matchingRoute = router.match(method, path);

			// get the params
			if (matchingRoute) {
				req.params = extend({}, matchingRoute.params);

				// actually call the route. For simplicity, just the first one
				matchingRoute.callbacks[0](req, res, next);
			} else {
				throw new Error('Cannot find a match for '+path);
			}

		},
		'path': function() {
			return route || '/';
		},
		'makeAssertionCallback': function(callback, assertions) {
			return function(err, sideEffects) {
				try {
					assertions(err, sideEffects);
					callback();
				} catch (e) {
					callback(e);
				}
 			};
		},
		'makeRequest': function(getMap) {
			var requestObject = Object.create(null);
			requestObject.get = function(property) {
				return getMap[property];
			};

			Object.defineProperty(requestObject, 'session', {
				get: function() {
					return sideEffects.session;
				},
				set: function(newValue) {
					sideEffects.session = newValue;
				}
			});

			defaultRequest = requestObject;

			return requestObject;
		},
		'makeResponse': function(callback) {
			defaultResponse =  {
				redirect: function(location) {
					sideEffects.redirect = location;
					callback(null, sideEffects);
				},
				render: function(viewName, model) {
					sideEffects.viewName = viewName;
					sideEffects.model = model;
					callback(null, sideEffects);
				}
			};
			return defaultResponse;
		}
	};

};

module.exports = MockExpress;