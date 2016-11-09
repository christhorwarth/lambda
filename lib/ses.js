
var aws = require('aws-sdk');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var ses = new aws.SES();

module.exports.send = function(email, cb) {
	ses.sendEmail({
		'Source': _app.setting('aws.ses_email'),
		'Destination': {
			'ToAddresses': [email.to]
		},
		'Message': {
			'Subject': {
				'Data': email.subject
			},
			'Body': {
				'Html': {
					'Data': email.html
				},
				'Text': {
					'Data': email.text
				}
			}
		}
	}, cb);
};
