
var random = function(len, chars) {
    var result = '';
    for(var i = len; i > 0; --i) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
};

module.exports.string = function(len) {
	return random(len, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
};

module.exports.number = function(len) {
	return random(len, '0123456789');
};
