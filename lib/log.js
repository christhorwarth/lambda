
var json = require('./json');
var _ = require('lodash');

module.exports = function() {
	return console.log.apply(console, arguments);
};

module.exports.info = module.exports;

module.exports.json = function() {
	return console.log.apply(console, _.map(arguments, json.stringify));
};
