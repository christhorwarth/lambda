
var _ = require('lodash');
var Err = require('./err');

var Res = function(e, ctx, cb) {
	this.cb = cb;
	this.done = _.bind(this._done, this);
};

Res.prototype.err = function(err) {
	this.cb(null, {
		'success': false,
		'err': Err(err),
		'instance': _app.instance
	});
	return this;
};

Res.prototype.success = function(res) {
	this.cb(null, {
		'success': true,
		'result': res,
		'instance': _app.instance
	});
	return this;
};

Res.prototype._done = function(err, res) {
	if(err)
		return this.err(err);
	return this.success(res);
};

module.exports = function(e, ctx, cb) {
	return new Res(e, ctx, cb);
};
