module.exports = exports = create;

var Html = require('htmler');
var path = require('path');
var utils = require('./utils');
var async = require('async');
var fs = require('fs');
var inflection = require('inflection');

function create (fields) {
	this.fields = fields;
	this.inputFields = inputFields;
	this.getField = getField;
	this.forEachField = forEachField;
	this.valueToImage = valueToImage;
	this.hasUploadField = hasUploadField;
	this.isFileField = isFileField;
	this.checkFile = checkFile;
	this.thumbPath = thumbPath;
	this.humanFileSize = humanFileSize;
	this.thumbImage = thumbImage;
	this.thumbUrl = thumbUrl;
	this.presentValue = presentValue;
	this.getRealName = getRealName;
	this.getRealNames = getRealNames;
	this.getPresentType = getPresentType;
	this.getPresentKey = getPresentKey;
	this.convert = convert;
	this.deleteFiles = deleteFiles;
	this.getReferences = getReferences;
	this.getReferenceNames = getReferenceNames;
	this.addValues = addValues;
}

// @return array
function inputFields () {
	var list = [];
	this.forEachField(function (name, field) {
		list.push(name);
	}, function (field) {
		return field.isInput;
	})
	return list;
}

/**
 * @callback: function
 * @whiteList: array or hash or function
 */
function forEachField (callback, whiteList) {
	var self = this;
	var filter;
	if ( !whiteList ) {
		whiteList = Object.keys(this.fields);
	} else if ( !Array.isArray(whiteList) && typeof whiteList == 'object') {
		whiteList = Object.keys(whiteList);
	} else if (typeof whiteList == 'function') {
		filter = whiteList;
		whiteList = Object.keys(this.fields);
	}
	
	whiteList.forEach(function (name) {
		var field;
		var realName = getRealName(name);
		
		field = self.fields[realName]; //允许 photo|image, photo|thumb, config.name  这类格式
		
		if (filter) {
			if (!filter(field)) return;
		}
		
		if (field) {
			field.name = realName; // important!
			callback(name, field, self);
		} else {
			throw new Error('invalid field: %s', name);
		}
		
	});
}

function getField (name) {
	return this.fields[name];
}

function valueToImage (name, value) {
	var field = this.getField(name);
	return Html.img({src: path.join(field.url, value)});
}

function thumbImage (name, value) {
	var field = this.getField(name);
	if (field.hasThumb) {
		return Html.img({src: path.join(this.thumbUrl(field), value)});
	} else {
		return false;
	}
}

function hasUploadField () {
	var has = false;
	this.forEachField(function (name, field) {
		if (!has && field.inputType == 'file') {
			has = true;
		}
	});
	return has;
}

function checkFile (name, file) {
	var field = this.getField(name);
	var ext;
	function addSource (s) {
		return s + ', 源文件: ' + file.originalFilename;
	}
	
	if (file.originalFilename == '') {
		if (field.required || field.isRequired) {
			return '请上传文件';	
		}
		return true;
	}
	
	if (!this.isFileField(field)) {
		return '未定义此文件字段';
	}
	
	if (field.isImage) {
		if (file.type.split('/')[0] != 'image') {
			return addSource('不能识别的图片');
		}
	}
	
	ext = utils.fileExt(file.path);
	
	if ((field.exts || []).indexOf(ext) == -1) {
		return addSource('不支持"' + ext + '"文件类型');
	}
	
	if (field.maxFileSize) {
		if (field.maxFileSize < file.size) {
			return addSource('文件太大, 文件最大限制' + humanFileSize(field.maxFileSize));
		}
	}
	return true;
	
}

function isFileField (field) {
	if (typeof field == 'string') {
		field = this.getField(field);
	}
	
	if (!field) return false;
	return field.inputType == 'file';
}

function humanFileSize (size) {
	if (size < 1048576) { // 1m
		return parseInt(size * 10 / 1024) / 10  + 'k';
	} else {
		return parseInt(size * 10 / 1048576 ) / 10  + 'm';
	}
}

function thumbPath (field) {
	if (typeof field == 'string') {
		field = this.getField(field);
	}
	return field.thumbPath ? field.thumbPath : path.join(field.path, 'thumbs');
}

function thumbUrl (field) {
	if (typeof field == 'string') {
		field = this.getField(field);
	}
	return field.thumbUrl ? field.thumbUrl : path.join(field.url, 'thumbs');
}

function presentValue (name, value) {
	var presentType = this.getPresentType(name);
	var presentKey = this.getPresentKey(name);
	var name = this.getRealName(name);
	var field = this.getField(name);
	
	if (value === null || value === undefined || value === '') {
		return value;
	}
	
	switch (presentType) {
		case 'image':
			if (field.isImage) {
				return this.valueToImage(name, value);
			}
			break;
		case 'thumb':
			if (field.isImage && field.hasThumb) {
				return this.thumbImage(name, value)
			}
			break;
		default:
			if (typeof value === 'object') {
				if (presentKey) {
					return value[presentKey];
				}
			}
	}
	return value;
}

function getRealNames (names) {
	var realNames = [];
	names.forEach(function (name) {
		realNames.push(getRealName(name));
	});
	return realNames;
}

function getRealName (name) {
	var type = getPresentType (name);
	var key = getPresentKey (name);
	name = name.replace('|' + type, '');
	name = name.replace('.' + key, '');
	return name;
}

function getPresentType (name) {
	return name.split('|')[1] || 'plain';
}

function getPresentKey (name) {
	return name.split('.')[1];
}

function deleteFiles (record, changedFields, callback) {
	var self = this;
	var tasks = [];
	
	this.forEachField(function (name, field) {
		if (field.isImage) {
			tasks.push(field);
		}
	}, changedFields);
	
	function deleteOne (field, callback) {
		var value = record[field.name];
		var unlink = function (file, exists, next) {
			if (exists) {
				fs.unlink(file, next);
			} else {
				next();
			}
		};
		
		async.waterfall([
			function (next) {
				var imageFile = path.join(field.path, value);
				fs.exists(imageFile, function (exists) {
					next(null, imageFile, exists);
				});
			},
			unlink,
			function (next) {
				var thumbFile = path.join(self.thumbPath(field), value);
				fs.exists(thumbFile, function (exists) {
					next(null, thumbFile, exists);
				});
			},
			unlink
		], callback);
	} // end of deleteOne
	
	async.each(tasks, deleteOne, callback);	
}

function convert (data, showFields) {
	this.forEachField(function (name, field) {
		switch (field.type) {
			case 'boolean':
				data[name] = data[name] === 'on';
				break;
		}
	
	}, showFields);
	return data;
}

function getReferenceTable (field) {
	if (field.ref) {
		return field.ref;
	} else {
		return inflection.pluralize(field.name.substring(1))
	}
}

function getReferenceNames (showFields) {
	var list = [];
	
	this.forEachField(function (name, field) {
		if (field.type == 'ref') {
			list.push(getReferenceTable(field));
		}
	}, showFields);
	return list;
}

function getReferences (showFields) {
	var map = {};
	
	this.forEachField(function (name, field) {
		if (field.type == 'ref') {
			map[name] = {
				table: getReferenceTable(field),
				options: field.prepare || {}
			};
		}
	
	}, showFields);
	return map;
}

function addValues (name, values) {
	this.fields[name].values = values;
}