
var mime = require('mime');
var aws = require('aws-sdk');
var policy = require('s3-policy');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var s3 = new aws.S3();

module.exports.putObject = function(bucket, path, buffer, options, cb) {
	options = options || {};

	s3.putObject({
		'ACL': options.acl || 'public-read',
		'Bucket': bucket,
		'Key': path,
		'Body': buffer,
		'ContentType': options.type || mime.lookup(path),
		'CacheControl': options.cache ? 'max-age=31536000' : undefined
	}, cb);

	return module.exports;
};

module.exports.getObject = function(bucket, path, cb) {
	s3.getObject({
		'Bucket': bucket,
		'Key': path
	}, cb);

	return module.exports;
};

module.exports.createToken = function(options, cb) {
	options = options || {};
	options.lifetime = options.lifetime || (15 * 60 * 1000);
	options.maxSize = options.maxSize || (10 * 1024 * 1024);
	var p = policy({
		'secret': _app.setting('aws.secret'),
		'length': options.maxSize,
		'bucket': options.bucket,
		'key': options.path,
		'expires': new Date(Date.now() + options.lifetime),
		'acl': 'private'
	});

	cb(null, {
		'policy': p.policy,
		'signature': p.signature,
		'key': _app.setting('aws.key')
	});
};
