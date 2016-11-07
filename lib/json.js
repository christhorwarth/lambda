
var _ = require('lodash');

module.exports.stringify = function() {
	return JSON.stringify.apply(JSON, _.toArray(arguments));
};

module.exports.parse = function() {
	try {
		return JSON.parse.apply(JSON, _.toArray(arguments));
	} catch(e) {
		return null;
	}
};
