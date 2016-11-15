
var aws = require('aws-sdk');
var _ = require('lodash');
var guid = require('./guid');
var cls = require('./class');

aws.config.update({
	'region': _app.setting('aws.region'),
	'accessKeyId': _app.setting('aws.key'),
	'secretAccessKey': _app.setting('aws.secret')
});

var client = module.exports.client = new aws.DynamoDB.DocumentClient();

(function() {
	var Instance = function(item) {
		this.item = item || {};
		this.updates = [];
		this.orm = true;
	};

	cls.prop(Instance, 'model');

	Instance.prototype.get = function(key) {
		return this.item[key];
	};

	Instance.prototype.set = function(key, val) {
		this.item[key] = val;
		this.updates[key] = val;
		return this;
	};

	Instance.prototype.remove = function(key) {
		delete this.item[key];
		this.updates[key] = undefined;
		return this;
	};

	Instance.prototype.raw = Instance.prototype.toJSON = function() {
		return this.item;
	};

	Instance.prototype.save = function(cb) {
		cb = cb || function() {};
		var self = this;
		this.model().update(this.item.guid, this.updates, function(err, res) {
			if(!err)
				self.updates = {};
			cb(err, res);
		});
		return this;
	};

	Instance.prototype.destroy = function(cb) {
		cb = cb || function() {};
		this.model().removeByKey(this.get('guid'), cb);
		return this;
	};

	var Model = function() {};

	cls.prop(Model, 'table');

	Model.prototype.index = function(id, val) {
		this.indexes = this.indexes || {};
		this.indexes[id] = val || id;
		return this;
	};

	Model.prototype.classMethod = function(id, fn) {
		this[id] = fn;
		return this;
	};

	Model.prototype.instance = function(item) {
		if(!item || item.orm)
			return item;
		var instance = new Instance(item);
		instance.model(this);
		_.forIn(this.instanceMethods, function(fn, id) {
			instance[id] = fn;
		});
		return instance;
	};

	Model.prototype.instances = function(items) {
		var self = this;
		return _.map(items, function(item) {
			return self.instance.call(self, item);
		});
	};

	Model.prototype.instanceMethod = function(id, fn) {
		this.instanceMethods = this.instanceMethods || {};
		this.instanceMethods[id] = fn;
		return this;
	};

	Model.prototype.create = function(item, cb) {
		cb = cb || function() {};
		if(!item.guid)
			item.guid = guid.create();

		if(!item.created)
			item.created = _.now();

		var self = this;
		client.put({
			'TableName': this.table(),
			'Item': item
		}, function(err) {
			if(err)
				return cb(err);
			cb(null, self.instance(item));
		});

		return this;
	};

	Model.prototype.key = function(key) {
		if(_.isString(key)) {
			key = {
				'guid': key
			};
		}
		return key;
	};

	Model.prototype.keys = function(keys) {
		var ret = {};
		ret[this.table()] = {
			'Keys': _.map(keys, this.key)
		};

		return ret;
	};

	Model.prototype.findByKey = function(key, cb) {
		cb = cb || function() {};
		if(!key)
			return cb();

		var self = this;
		client.get({
			'TableName': this.table(),
			'Key': this.key(key)
		}, function(err, res) {
			if(err)
				return cb(err);
			var item = _.get(res, 'Item');
			if(item)
				item = self.instance(item);
			cb(null, item);
		});

		return this;
	};

	Model.prototype.findByKeys = function(keys, cb) {
		cb = cb || function() {};
		var self = this;
		client.batchGet({
			'RequestItems': this.keys(keys)
		}, function(err, res) {
			if(err)
				return cb(err);
			var items = _.get(res, 'Responses.map', []);
			items = self.instances(items);
			cb(null, items);
		});
		return this;
	};

	Model.prototype.findAll = function(options, cb) {
		cb = cb || function() {};

		var self = this;
		var query;

		if(!options.index) {
			if(options.where) {
				query = {
					'FilterExpression': '',
					'ExpressionAttributeValues': {}
				};

				_.forIn(options.where, function(val, id) {
					query.FilterExpression += id + ' = :' + id;
					query.ExpressionAttributeValues[':' + id] = val;
				});
			}

			client.scan(_.merge({
				'TableName': this.table(),
				'Limit': options.limit || 20,
				'AttributesToGet': options.attributes
			}, query), function(err, res) {
				if(err)
					return cb(err);
				cb(null, {
					'items': self.instances(_.get(res, 'Items', []))
				});
			});
			return this;
		}

		query = {
			'KeyConditionExpression': '',
			'ExpressionAttributeValues': {}
		};

		_.forIn(options.where, function(val, id) {
			query.KeyConditionExpression += id + ' = :' + id;
			query.ExpressionAttributeValues[':' + id] = val;
		});

		if(options.index && this.indexes[options.index])
			options.index = this.indexes[options.index];

		client.query(_.merge({
			'TableName': this.table(),
			'IndexName': options.index,
			'Limit': options.limit || 20,
			'AttributesToGet': options.attributes
		}, query), function(err, res) {
			if(err)
				return cb(err);

			cb(null, {
				'items': self.instances(_.get(res, 'Items', []))
			});
		});

		return this;
	};

	Model.prototype.findOne = function(options, cb) {
		cb = cb || function() {};
		options.limit = 1;
		return this.findAll(options, function(err, res) {
			if(err)
				return cb(err);
			cb(null, _.first(_.get(res, 'items', [])));
		});
	};

	Model.prototype.update = function(key, operations, cb) {
		cb = cb || function() {};
		var types = {
			'set': {},
			'remove': []
		};

		if(!operations.updated)
			operations.updated = _.now();

		_.forIn(operations, function(val, id) {
			if(_.isUndefined(val))
				types.remove.push(id);
			else
				types.set[id] = val;
		});

		var update = {
			'UpdateExpression': [],
			'ExpressionAttributeValues': {}
		};

		if(!_.isEmpty(types.set)) {
			update.UpdateExpression.push('set');
			var i = 0;
			var total = _.size(types.set);
			_.forIn(types.set, function(val, id) {
				update.UpdateExpression.push(id + ' = :' + id + (i + 1 < total ? ',' : ''));
				update.ExpressionAttributeValues[':' + id] = val;
				i++;
			});
		}

		if(types.remove.length)
			update.UpdateExpression.push('remove ' + types.remove.join(', '));

		update.UpdateExpression = update.UpdateExpression.join(' ');
		client.update(_.merge({
			'TableName': this.table(),
			'Key': this.key(key)
		}, update), function(err, res) {
			cb(err);
		});

		return this;
	};

	Model.prototype.removeByKey = function(key, cb) {
		cb = cb || function() {};
		client.delete({
			'TableName': this.table(),
			'Key': this.key(key)
		}, cb);
		return this;
	};

	Model.prototype.removeByKeys = function(keys, cb) {
		cb = cb || function() {};
		var req = {};
		req[table] = _.map(keys, function(key) {
			return {
				'DeleteRequest': {
					'Key': this.key(key)
				}
			};
		});

		client.batchWrite({
			'RequestItems': req
		}, cb);
		return this;
	};

	module.exports.model = function() {
		return new Model();
	};
})();
