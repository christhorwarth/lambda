
var _ = require('lodash');

module.exports = function(settings) {
	var ret = function(id, def) {
		return _.get(settings, id, def);
	};

	ret.set = function(id, val) {
		settings[id] = val;
		return ret;
	};

	return ret;
};
