
var _ = require('lodash');

var Err = function(code, message) {
	this._err = true;
	if(_.isError(code))
		code = code.message;
	if(_.isString(code))
		this.code = code;
	if(_.isString(message))
		this.message = message;
};

Err.prototype.toJSON = function() {
	return {
		'code': _.toString(this.code).toLowerCase() || 'unknown',
		'message': this.message
	};
};

module.exports = function(code, message) {
	if(code && code._err)
		return code;
	return new Err(code, message);
};
