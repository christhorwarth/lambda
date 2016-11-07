
module.exports.app = function(settings, exports) {
	if(global._app)
		return global._app;

	var app = global._app = {};

	app.settings = app.setting = require('./lib/settings')(settings);
	app.log = require('./lib/log');
	app.loader = require('./lib/loader');
	app.instance = require('./lib/random').string(6);
	app.router = require('./lib/router');

	var args = require('minimist')(process.argv.slice(2));
	if(args.deploy)
		require('./lib/deploy').run();
	else
		exports.handler = app.router.run;

	return app;
};
