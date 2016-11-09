
var request = require('request');
var _ = require('lodash');

module.exports.verify = function(data, cb) {
	data = data || {};
	if(!data.ip)
		return cb('RECAPTCHA:MISSING_IP');
	if(!data.response)
		return cb('RECAPTCHA:MISSING_RESPONSE');

	request({
		'url': 'https://www.google.com/recaptcha/api/siteverify',
		'method': 'POST',
		'json': true,
		'qs': {
			'secret': _app.setting('recaptcha'),
			'remoteip': data.ip,
			'response': data.response
		}
	}, function(err, res, body) {
		if(err)
			return cb(err);
		if(!body.success)
			return cb(_.first(body['error-codes']));
		cb();
	});
};
