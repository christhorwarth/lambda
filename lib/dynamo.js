
var aws = require('aws-sdk');
var _ = require('lodash');
var guid = require('./guid');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var client = module.exports.client = new aws.DynamoDB.DocumentClient();

var Key = function(key) {
	if(_.isString(key)) {
		key = {
			'guid': key
		};
	}
	return key;
};

module.exports.create = function(table, item, cb) {
	if(!item.guid)
		item.guid = guid.create();
	client.put({
		'TableName': table,
		'Item': item
	}, function(err) {
		if(err)
			return cb(err);
		cb(null, item);
	});
	return module.exports;
};

module.exports.get = function(table, key, cb) {
	client.get({
		'TableName': table,
		'Key': Key(key)
	}, function(err, res) {
		if(err)
			return cb(err);
		cb(null, _.get(res, 'Item'));
	});
	return module.exports;
};

var batchKeys = function(table, keys) {
	var ret = {};
	ret[table] = {
		'Keys': _.map(keys, Key)
	};

	return ret;
};

module.exports.get.batch = function(table, keys, cb) {
	if(_.isEmpty(keys)) {
		cb(null, []);
		return module.exports;
	}

	client.batchGet({
		'RequestItems': batchKeys(table, keys)
	}, function(err, res) {
		if(err)
			return cb(err);
		cb(null, _.get(res, 'Responses.map', []));
	});
	return module.exports;
};

module.exports.remove = function(table, key, cb) {
	client.delete({
		'TableName': table,
		'Key': Key(key)
	}, cb);
	return module.exports;
};

module.exports.remove.batch = function(table, keys, cb) {
	if(_.isEmpty(keys)) {
		cb();
		return module.exports;
	}

	var req = {};
	req[table] = _.map(keys, function(key) {
		return {
			'DeleteRequest': {
				'Key': Key(key)
			}
		};
	});

	client.batchWrite({
		'RequestItems': req
	}, cb);
	return module.exports;
};

module.exports.query = function(table, index, options, cb) {
	client.query(_.merge({
		'TableName': table,
		'IndexName': index
	}, options), function(err, res) {
		if(err)
			return cb(err);
		cb(null, _.get(res, 'Items'));
	});
	return module.exports;
};

module.exports.set = function(table, key, options, cb) {
	client.update(_.merge({
		'TableName': table,
		'Key': Key(key)
	}, options), function(err, res) {
		cb(err);
	});
	return module.exports;
};
