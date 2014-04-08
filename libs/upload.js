exports.create = create;

var fs = require('fs');
var rander = require('rander');
var path = require('path');
var utils = require('./utils');
var async = require('async');
var gm = require('gm');

function create (files, schemas) {
	
	this.files = files;
	this.schemas = schemas;
	this.data = {};
	
	this.validate = validate;
	this.save = save;
}

// waterfall steps:  validate -> save -> crop -> thumb

function validate () {
	var _this = this;
	var isPass = true;
	this.errors = {};
	
	forEachFile(this.files, function (name, file) {
		var message = _this.schemas.checkFile(name, file);
		if (message !== true) {
			_this.errors[name] = message;
			fs.unlinkSync(file.path);
			isPass = false;
		}
	});
	
	return isPass;
}

// should be used after validate()
function save (callback) {
	var _this = this;
	var filenames = Object.keys(this.files);
	
	// console.log(filenames);
	async.each(filenames, function(name, callback) {
		async.series([
			function (callback) {
				var field = _this.schemas.getField(name);
				checkFilePath(field.path, callback);
			},
			function (callback) {
				moveImage.call(_this, name, callback);
			},
			function (callback) {
				cropImage.call(_this, name, callback);
			},
			function (callback) {
				thumbImage.call(_this, name, callback);
			}
		], callback); // end of async.series
			
	}, callback); // end of async.each
}

function moveImage (name, callback) {
	var file = this.files[name];
	var field = this.schemas.getField(name);
	var targetFileName = toRandomFile(file.path);
	var targetFile = path.join(field.path, targetFileName);
	var _this = this;
	
	fs.rename(file.path, targetFile, function (e) {
		if (e) {
			callback(e);
		} else {
			_this.data[name] = targetFileName;
			if (field.sizeField) {
				_this.data[field.sizeField] = file.size;
			}
			callback();
		}
	});
}

function cropImage (name, callback) {
	var field = this.schemas.getField(name);
	var targetImage = path.join(field.path, this.data[name]);
	var imageSize = field.imageSize;
		
	if (Array.isArray(imageSize)) {
		gm(targetImage)
			.gravity('North') // NorthWest|North|NorthEast|West|Center|East|SouthWest|South|SouthEast
			.crop(imageSize[0], imageSize[1])
			.write(targetImage, callback);
	} else {
		callback();
	}
}

function thumbImage (name, callback) {
	var field = this.schemas.getField(name);
	var targetImage, thumbPath, thumbImage, thumbSize;
	
	if (field.hasThumb) {
		targetImage = path.join(field.path, this.data[name]);
		thumbPath = this.schemas.thumbPath(field);
		thumbImage = path.join(thumbPath, this.data[name]);
		thumbSize = field.thumbSize;
	
		if (Array.isArray(thumbSize)) {
			checkFilePath(thumbPath, function (e) {
				if (e) {
					callback(e);
				} else {
					gm(targetImage)
					.resize(thumbSize[0], thumbSize[1])
					.write(thumbImage, callback);	
				}
			});
		} else {
			callback();
		}
	} else {
		callback();
	}
}

function checkFilePath (path, callback) {
	fs.exists(path, function (exists) {
		if (!exists) {
			fs.mkdir(path, function (e) {
				if (e) {
					callback(e);
				} else {
					callback();
				}
			});
		} else {
			callback();
		}
	})
}

function forEachFile (files, callback) {
	Object.keys(files || {}).forEach(function (name) {
		callback(name, files[name]);
	});
}
	
function toRandomFile (source) {
	return [rander.string(6), utils.fileExt(source)].join('.');
}