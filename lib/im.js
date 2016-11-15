
var _ = require('lodash');
var type = require('file-type');

var gm = require('gm').subClass({
	'imageMagick': true
});

var Im = function(buffer) {
	if(buffer)
		this._image = gm(buffer);
};

Im.prototype.cover = function(size) {
	this._image = this._image.resize(size, size, '^').gravity('Center').extent(size, size);
	return this;
};

Im.prototype.size = function(cb) {
	this._image.size(cb);
	return this;
};

Im.prototype.toBuffer = function(format, cb) {
	this._image.noProfile().toBuffer(_.toString(format).toUpperCase(), cb);
	return this;
};

Im.prototype.clone = function() {
	var im = new Im();
	im._image = this._image;
	return im;
};

var formats = _.mapKeys(['png', 'jpg']);

module.exports.create = function(buffer) {
	var format = type(buffer);
	if(!formats[format.ext])
		return;
	return new Im(buffer);
};
