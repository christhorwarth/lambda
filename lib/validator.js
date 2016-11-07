
var async = require('async');
var _ = require('lodash');

var series = require('./flow').series;

var validators = {};

validators.required = function(val, cb) {
	if(_.isUndefined(val))
		return cb('REQUIRED');

	cb(null, val);
};

validators.string = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(!_.isString(val))
		return cb('INVALID_STRING');

	cb(null, _.trim(val));
};

validators.number = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(!_.isNumber(val))
		return cb('INVALID_NUMBER');

	cb(null, val);
};

validators.numeric = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	val = val.replace(/\D/g, '');
	cb(null, val);
};

validators.date = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(_.isString(val)) {
		val = Date.parse(val);
		if(_.isNaN(val))
			return cb('INVALID_DATE');
		val = new Date(val);
	}

	if(!_.isDate(val))
		return cb('INVALID_DATE');
	cb(null, val);
};

validators.upper = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	val = _.toString(val).toUpperCase();
	cb(null, val);
};

validators.lower = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	val = _.toString(val).toLowerCase();
	cb(null, val);
};

validators.object = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(!_.isPlainObject(val))
		return cb('INVALID_OBJECT');

	cb(null, val);
};

validators.array = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(!_.isArray(val))
		return cb('INVALID_ARRAY');

	cb(null, val);
};

validators.bool = function(val, cb) {
	if(_.isUndefined(val))
		return cb(null, val);

	if(!_.isBoolean(val))
		return cb('INVALID_BOOL');

	cb(null, val);
};

validators.enum = function(values) {
	values = _.mapKeys(values);
	return function(val, cb) {
		if(_.isUndefined(val))
			return cb(null, val);

		if(!values[val])
			return cb('INVALID_ENUM_VALUE');

		cb(null, val);
	};
};

validators.length = function(min, max) {
	return function(val, cb) {
		if(_.isUndefined(val))
			return cb(null, val);

		if(min && val.length < min)
			return cb('TOO_SHORT');

		if(max && val.length > max)
			return cb('TOO_LONG');

		cb(null, val);
	};
};

validators.range = function(min, max) {
	return function(val, cb) {
		if(_.isUndefined(val))
			return cb(null, val);

		if(min && val < min)
			return cb('RANGE_TOO_LOW');

		if(max && val > max)
			return cb('RANGE_TOO_HIGH');

		cb(null, val);
	};
};

validators.email = (function() {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	var valid = function(val) {
		return re.test(val);
	};

	var normalize = function(val) {
		return _.toString(val).toLowerCase();
	};

	return function(val, cb) {
		if(_.isUndefined(val))
			return cb(null, val);

		if(!valid(val))
			return cb('INVALID_EMAIL');

		cb(null, normalize(val));
	};
})();

validators.re = function(re) {
	return function(val, cb) {
		if(_.isUndefined(val))
			return cb(null, val);

		if(!re.test(val))
			return cb('INVALID_FORMAT');

		cb(null, val);
	};
};

var Field = function() {
	this.validators = [];
};

Field.prototype.validator = function(validator) {
	this.validators.push(validator);
	return this;
};

Field.prototype.type = function(type) {
	return this.validator(type);
};

Field.prototype.id = function(val) {
	var key = '_id';
	if(_.isUndefined(val))
		return this[key];

	this[key] = val;
	return this;
};

Field.prototype.object = function() {
	return this.type('object');
};

Field.prototype.array = function() {
	return this.type('array');
};

Field.prototype.string = function() {
	return this.type('string');
};

Field.prototype.number = function() {
	return this.type('number');
};

Field.prototype.numeric = function() {
	return this.string().validator('numeric');
};

Field.prototype.upper = function() {
	return this.string().validator('upper');
};

Field.prototype.lower = function() {
	return this.string().validator('lower');
};

Field.prototype.bool = function() {
	return this.type('bool');
};

Field.prototype.required = function() {
	return this.validator('required');
};

Field.prototype.email = function() {
	return this.string().validator('email');
};

Field.prototype.date = function() {
	return this.type('date');
};

Field.prototype.name = function() {
	return this.string().length(2, 80);
};

Field.prototype.password = function() {
	return this.string().length(6);
};

Field.prototype.enum = function() {
	this.validators.push(validators.enum(_.toArray(arguments)));
	return this;
};

Field.prototype.length = function(min, max) {
	this.validators.push(validators.length(min, max));
	return this;
};

Field.prototype.range = function(min, max) {
	this.number();
	this.validators.push(validators.range(min, max));
	return this;
};

Field.prototype.keys = function(cb) {
	if(_.isUndefined(cb))
		return this._keys;

	var self = this;
	self._keys = self._keys || {};
	cb(function(id) {
		var key = new Field();
		key.id(id);
		key.path(self.path());
		key.path().push(id);
		self._keys[id] = key;
		return key;
	});
	return this;
};

Field.prototype.path = function(path) {
	this._path = this._path || [];
	if(_.isUndefined(path))
		return this._path;

	this._path = _.clone(path);
	return this;
};

Field.prototype.items = function(cb) {
	if(_.isUndefined(cb))
		return this._items;

	this._items = new Field();
	this._items.path(this.path());
	cb(this._items);
	return this;
};

Field.prototype.validate = function(obj, cb) {
	var self = this;
	series()
					.step('validators', function(res, next) {
						async.eachSeries(self.validators, function(fn, next) {
							if(_.isString(fn))
								fn = validators[fn];

							fn.call(self, obj, function(err, _obj) {
								if(!err)
									obj = _obj;
								next(err);
							});
						}, function(err) {
							if(err)
								err = Err([err, self.path().join('.')].join(':'));
							next(err);
						});
					})
					.step('keys', function(res, next) {
						if(!self.keys() || !obj)
							return next();

						var o = {};
						async.forEachOfSeries(self.keys(), function(val, key, next) {
							val.validate(obj[val.id()], function(err, i) {
								if(!err)
									o[val.id()] = i;
								next(err);
							});
						}, function(err) {
							if(!err)
								obj = o;
							next(err);
						});
					})
					.step('items', function(res, next) {
						var items = self.items();
						if(!items || !obj)
							return next();

						var o = [];
						async.eachSeries(obj, function(item, next) {
							items.validate(item, function(err, i) {
								if(!err)
									o.push(i);

								next(err);
							});
						}, function(err) {
							if(!err)
								obj = o;

							next(err);
						});
					})
					.run(function(err) {
						cb(err, err ? undefined : obj);
					});

	return this;
};

Field.prototype.run = Field.prototype.validate;

var cache = {};
module.exports.create = function(id) {
	cache[id] = new Field();
	return cache[id];
};

module.exports.get = function(id) {
	return cache[id];
};
