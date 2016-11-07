
var rounds = 10;
var bcrypt = require('bcryptjs');

module.exports.hash = function(str, cb) {
	bcrypt.hash(str, rounds, cb);
};

module.exports.compare = function(str, hash, cb) {
	bcrypt.compare(str, hash, cb);
};
