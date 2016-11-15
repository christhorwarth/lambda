
var pug = require('pug');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var path = require('path');

var base;
module.exports.base = function() {
	base = path.join.apply(path, arguments);
	return module.exports;
};

var templates = {};

module.exports.register = function(id, template) {
	templates[id] = template;
	return module.exports;
};

module.exports.registerFile = function(id, file) {
	if(!file)
		file = id;
	templates[id] = {
		'path': path.join(base, id)
	};
	return module.exports;
};

module.exports.render = function(id, data, cb) {
	if(!templates[id])
		return cb('TEMPLATE_NOT_FOUND');

	if(_.isPlainObject(templates[id])) {
		if(!_.endsWith(templates[id].path, '.jade'))
			templates[id].path += '.jade';
		fs.readFile(templates[id].path, 'utf8', function(err, res) {
			if(err)
				return cb(err);
			templates[id] = res;
			return module.exports.render(id, data, cb);
		});
		return module.exports;
	}

	if(_.isString(templates[id]))
		templates[id] = pug.compile(templates[id]);

	var out = templates[id](_.merge(data, locals));
	out = _.trim(out);
	cb(null, out);
	return module.exports;
};

module.exports.renderEmail = function(id, data, cb) {
	var res = {};
	if(data.to)
		res.to = data.to;
	async.eachSeries(['subject', 'html', 'text'], function(mode, next) {
		data.mode = mode;
		module.exports.render(id, data, function(err, out) {
			if(err)
				return next(err);
			res[mode] = out;
			next();
		});
	}, function(err) {
		if(err)
			return cb(err);
		cb(null, res);
	});
};

var locals = {};
module.exports.local = function(id, val) {
	locals[id] = val;
	return module.exports;
};
