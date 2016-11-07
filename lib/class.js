
var _ = require('lodash');

module.exports.prop = function(cls, id, def) {
	var key = '_' + id;
	cls.prototype[id] = function(val) {
		if(_.isUndefined(val))
			return this[key] || def;
		this[key] = val;
		return this;
	};
};
