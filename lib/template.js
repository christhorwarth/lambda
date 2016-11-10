
var pug = require('pug');
var fs = require('fs');
var _ = require('lodash');

var templates = {};

module.exports.register = function(id, template) {
	templates[id] = template;
	return module.exports;
};

module.exports.registerFile = function(id, path) {
	templates[id] = {
		'path': path
	};
	return module.exports;
};

module.exports.render = function(id, data, cb) {
	if(!templates[id])
		return cb('TEMPLATE_NOT_FOUND');

	if(_.isPlainObject(templates[id])) {
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

	cb(null, templates[id](_.merge(data, locals)));
	return module.exports;
};

var locals = {};
module.exports.local = function(id, val) {
	locals[id] = val;
	return module.exports;
};
