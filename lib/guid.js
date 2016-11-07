
var uuid = require('node-uuid');

module.exports.create = function() {
	return uuid.v4();
};
