
module.exports.app = function(settings, exports) {
	if(global._app)
		return global._app;

	var app = global._app = {};

	app.settings = app.setting = require('./lib/settings')(settings);
	app.log = require('./lib/log');
	app.loader = require('./lib/loader');
	app.register = app.loader.register;
	app.instance = require('./lib/random').string(6);
	app.router = require('./lib/router');

	var ret = require('./lib/flow').series();
	ret.step('app', function(res, next) {
		next(null, app);
	});

	var args = require('minimist')(process.argv.slice(2));
	if(args.deploy) {
		require('./lib/deploy').run();
		return ret;
	}

	exports.handler = app.router.run;
	require('async').nextTick(ret.run);
	return ret;
};
