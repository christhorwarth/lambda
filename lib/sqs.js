
var aws = require('aws-sdk');
var _ = require('lodash');

var json = require('./json');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var sqs = new AWS.SQS();

module.exports.push = function(queue, msg, cb) {
	sqs.sendMessage({
		'MessageBody': json.stringify(msg),
		'QueueUrl': queue,
		'DelaySeconds': 0
	}, cb);

	return module.exports;
};

module.exports.pop = function(queue, max, cb) {
	sqs.receiveMessage({
		'QueueUrl': queue,
		'MaxNumberOfMessages': max || 10
	}, function(err, res) {
		if(err) {
			return cb && cb(err);
		}
		if (cb) {
			cb(null, _.map(res.Messages, function(msg) {
				return {
					'id': msg.MessageId,
					'handle': msg.ReceiptHandle,
					'body': json.parse(msg.Body)
				};
			}));
		}
	});

	return module.exports;
};

module.exports.remove = function(queue, handle, cb) {
	sqs.deleteMessage({
		'QueueUrl': queue,
		'ReceiptHandle': handle
	}, cb);
};
