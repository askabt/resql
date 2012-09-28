/*
 *  This file comes from the documentation of Kris Kowal's Q library.
 */

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    // XXX
                    process.nextTick(function () {
                        value.then.apply(value, pending[i]);
                    });
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback, _errback) {
                var result = defer();
                _callback = _callback || function (value) {
                    return value;
                };
                _errback = _errback || function (reason) {
                    return reject(reason);
                };
                var callback = function (value) {
                    result.resolve(_callback(value));
                };
                var errback = function (reason) {
                    result.resolve(_errback(reason));
                };
                if (pending) {
                    pending.push([callback, errback]);
                } else {
                    process.nextTick(function () {
                        value.then(callback, errback);
                    });
                }
                return result.promise;
            }
        }
    };
};

var ref = function (value) {
    if (value && value.then)
        return value;
    return {
        then: function (callback) {
            var result = defer();
            process.nextTick(function () {
                result.resolve(callback(value));
            });
            return result.promise;
        }
    };
};

var reject = function (reason) {
    return {
        then: function (callback, errback) {
            var result = defer();
            process.nextTick(function () {
                result.resolve(errback(reason));
            });
            return result.promise;
        }
    };
};

defer.reject = reject;
module.exports = defer;