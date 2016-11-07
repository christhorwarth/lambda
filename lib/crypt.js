
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var key = _app.setting('encryption_key');

var json = loader.lib('json');

module.exports.encrypt = function(str) {
	var cipher = crypto.createCipher(algorithm, key);
	var crypted = cipher.update(str,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
};

module.exports.encrypt.json = function(obj) {
	return module.exports.encrypt(json.stringify(obj));
};

module.exports.decrypt = function(str) {
	var decipher = crypto.createDecipher(algorithm, key);
	var dec = decipher.update(str,'hex','utf8');
	dec += decipher.final('utf8');
	return dec;
};

module.exports.decrypt.json = function(str) {
	return json.parse(module.exports.decrypt(str));
};
