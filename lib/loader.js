
var _ = require('lodash');
var path = require('path');
var root = path.dirname(require.main.filename);

module.exports.register = function(type, base) {
	module.exports[type] = function(id) {
		return require(path.join(base || root, type, id));
	};
	return module.exports;
};

module.exports.register('lib', __dirname);

var cache = {};
module.exports.resolve = function(str) {
	if(cache[str])
		return cache[str];

	var path = str.replace(/\s/g, '').split('>');
	var base = path.shift();

	if(_.startsWith(base, 'c:'))
		base = module.exports.controller && module.exports.controller(base.replace('c:', ''));
	else if(_.startsWith(base, 'm:'))
		base = module.exports.middleware && module.exports.middleware(base.replace('m:', ''));

	cache[str] = base;
	if(path.length)
		cache[str] = _.get(cache[str], path.join('.'));


	if(!cache[str] || !_.isFunction(cache[str]))
		throw new Error('Cannot locate:', str);

	return cache[str];
};
