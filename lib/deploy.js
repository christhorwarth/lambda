
var root = require('path').dirname(require.main.filename);
var flow = require('./flow');

var fs = require('fs');
var archiver = require('archiver');
var aws = require('aws-sdk');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret'),
});

var lambda = new aws.Lambda();

module.exports.run = function(cb) {
	cb = cb || function() {};
	flow.series()
				.step('build', function(res, next) {
					next(null, './build.zip');
				})
				.step('zip', function(res, next) {
					var output = fs.createWriteStream(res.build);
					var archive = archiver('zip');

					_app.log('Zipping code...');

					output.on('close', function () {
						_app.log('Zipped', archive.pointer(), 'total bytes.');
						next();
					});

					archive.on('error', function(err){
						next(err);
					});

					archive.pipe(output);
					archive.bulk([{
						'expand': true,
						'cwd': root,
						'src': ['**'],
						'dest': '.'
					}]);

					archive.finalize();
				})
				.step('upload', function(res, next) {
					var zip = fs.readFileSync(res.build);

					_app.log('Uploading code...');

					lambda.updateFunctionCode({
						'FunctionName': _app.setting('aws.function'),
						'ZipFile': zip
					}, function(err, res) {
						_app.log('Upload complete', err, res);
						cb(err);
					});
				})
				.step('remove', function(res, next) {
					fs.unlink(res.build, next);
				})
				.run(function(err) {
					_app.log('Complete', err);
					cb(err);
				});
};
