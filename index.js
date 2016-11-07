
module.exports.app = function(settings) {
	if(global._app)
		return global._app;

	var app = global._app = {};

	app.settings = app.setting = require('./lib/settings')(settings);
	app.log = require('./lib/log');
	app.loader = require('./lib/loader');
	app.instance = require('./lib/random').string(6);
	app.router = require('./lib/router');
	app.deploy = require('./lib/deploy').run;

	return app;
};
