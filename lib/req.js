
var _ = require('lodash');
var cls = require('./class');

var Req = function(e, ctx, cb) {
	this._ip = e.ip;
	this._user_agent = e.user_agent;
	this.body = e.body || {};
	this.body.params = this.body.params || {};

	if(e.type == 'heartbeat') {
		this.body = {
			'action': 'heartbeat',
			'params': {}
		};
	} else if(e.Records) {
		var record = _.first(e.Records);
		if(record) {
			if(record.eventSource == 'aws:s3' && record.eventName == 'ObjectCreated:Post') {
				this.body = {
					'params': record.s3 || {},
					'action': 's3:uploaded'
				};
			}
		}
	}
};

Req.prototype.param = function(id, def) {
	return _.get(this.body.params, id, def);
};

cls.prop(Req, 'user');
cls.prop(Req, 'ip');
cls.prop(Req, 'user_agent');
cls.prop(Req, 'stripe');
cls.prop(Req, 'event');
cls.prop(Req, 'admin');

module.exports = function(e, ctx, cb) {
	return new Req(e, ctx, cb);
};
