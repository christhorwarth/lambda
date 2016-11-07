
var _ = require('lodash');
var async = require('async');

var Req = require('./req');
var Res = require('./res');

var actions = {};
var middleware = [];

module.exports.use = function() {
	var chain = _.toArray(arguments);
	middleware = _.concat(middleware, chain);
	for(var p in actions)
		actions[p] = _.concat(actions[p], chain);
	return module.exports;
};

module.exports.action = function() {
	var chain = _.toArray(arguments);
	var id = chain.shift();
	actions[id] = _.concat(middleware, chain);
	return module.exports;
};

module.exports.run = function(e, ctx, cb) {
	var req = Req(e, ctx, cb);
	var res = Res(e, ctx, cb);

	var chain = actions[req.body.action];
	if(!chain)
		return res.err('INVALID_ACTION');

	async.eachSeries(chain, function(fn, next) {
		if(_.isString(fn))
			fn = loader.resolve(fn);
		fn(req, res, next);
	}, function(err) {
		if(err)
			return res.err(err);
		res.success();
	});
};
