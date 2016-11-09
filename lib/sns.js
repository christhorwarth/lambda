
var aws = require('aws-sdk');
var _ = require('lodash');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var sns = new aws.SNS();

module.exports.sms = function(text, cb) {
	text.phone = text.phone.replace(/\D/g,'');
	if(!_.startsWith(text.phone, '1'))
		text.phone = '1' + text.phone;
	text.phone = '+' + text.phone;
	sns.publish({
		'Message': text.message,
		'MessageStructure': 'string',
		'PhoneNumber': text.phone
	}, cb);
};
