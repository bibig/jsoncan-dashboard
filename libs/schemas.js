exports.create = create;

var Html       = require('htmler');
var path       = require('path');
var yi         = require('yi');
var inflection = require('inflection');
var async      = require('async');
var fs         = require('fs');


function create (fields) {
  return new Schemas(fields);
}

function fileExt (filename) {
  var info = filename.split('.');
  return info[info.length - 1];
}

/* ------------Schemas construction-------------- */

function Schemas  (fields) {
  this.fields = fields;
}

Schemas.prototype.inputFields = function () {
  var list = [];

  this.forEachField(function (name, field) {
    list.push(name);
  }, function (name, field) {
    return field.isInput;
  });

  return list;
};

Schemas.prototype.safeFilters = function (hash) {
  return yi.filter(hash, Object.keys(this.fields));
};

/**
 * @callback: function
 * @whiteList: array or hash or function
 */
Schemas.prototype.forEachField = function (callback, whiteList) {
  var self = this;

  yi.forEach(this.fields, function (name, field) {
    
    if (field) {
      field.name = name; // important!
      callback(name, field, self);  
    }

  }, whiteList);

};

Schemas.prototype.forEachRefField = function (callback) {
  this.forEachField(callback, function (name, field) {
    return field.type == 'ref';
  });
};

Schemas.prototype.forEachSessionField = function (callback) {
  this.forEachField(callback, function (name, field) {
    return yi.isNotEmpty(field.session) && typeof field.session === 'function';
  });
};

Schemas.prototype.getFileRelatedData = function (record) {
  var data = {};

  this.forEachField(function (name, field) {
    if (field.inputType == 'file') {
      data[name] = record[name];
      if (field.sizeField) {
        data[field.sizeField] = record[field.sizeField];
      }
    }
  }, record);

  return data;
};

Schemas.prototype.getField = function (name, key) {
  var field = this.fields[name];

  return key ? field[key] : field;
};

Schemas.prototype.imageSrc = function (name, value) {
  var field = this.getField(name);

  if (field.url) {
    return path.join(field.url, value);
  }

  return null;
};

Schemas.prototype.thumbSrc = function (name, value) {
  var field = this.getField(name);

  if (field.hasThumb) {
    return path.join(this.thumbUrl(field), value);
  }

  return null;
};

Schemas.prototype.thumbImage = function (name, value) {
  var field = this.getField(name);

  if (field.hasThumb) {
    return Html.img({src: path.join(this.thumbUrl(field), value)});
  } else {
    return false;
  }
};

Schemas.prototype.hasUploadField = function () {
  var has = false;

  this.forEachField(function (name, field) {
    if (!has && field.inputType == 'file') {
      has = true;
    }
  });

  return has;
};

//@isEditAction: 修改记录时，应该允许不上传文件，因为有可能只是修改其它字段
Schemas.prototype.checkFile = function (name, file) {
  var field = this.getField(name);
  var ext;

  function addSource (s) {
    return s + ', 源文件: ' + file.originalFilename;
  }
  
  if (file.originalFilename === '') {

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
  
  ext = fileExt(file.path);
  
  if ((field.exts || []).indexOf(ext) == -1) {
    return addSource('不支持"' + ext + '"文件类型');
  }
  
  if (field.maxFileSize) {

    if (field.maxFileSize < file.size) {
      return addSource('文件太大, 文件最大限制' + yi.humanSize(field.maxFileSize));
    }

  }

  return true;
};

Schemas.prototype.isFileField = function (field) {
  
  if (typeof field == 'string') {
    field = this.getField(field);
  }
  
  if (!field) return false;

  return field.inputType == 'file';
};

Schemas.prototype.thumbPath = function (field) {
  
  if (typeof field == 'string') {
    field = this.getField(field);
  }

  return field.thumbPath ? field.thumbPath : path.join(field.path, 'thumbs');
};

Schemas.prototype.thumbUrl = function (field) {
  
  if (typeof field == 'string') {
    field = this.getField(field);
  }

  return field.thumbUrl ? field.thumbUrl : path.join(field.url, 'thumbs');
};

Schemas.prototype.getReferenceTable = function (field) {
  
  if (typeof field == 'string') {
    field = this.getField(field);
  }
  
  if (field.ref) {
    return field.ref;
  } else {
    return inflection.pluralize(field.name.substring(1));
  }
};

Schemas.prototype.getReferenceField = function (table) {
  return '_' + inflection.singularize(table);
};

Schemas.prototype.getReferenceNames = function (showFields) {
  var list = [];
  var self = this;
  
  this.forEachField(function (name, field) {
    if (field.type == 'ref') {
      list.push(self.getReferenceTable(field));
    }
  }, showFields);

  return list;
};

Schemas.prototype.getReferences = function (showFields) {
  var map = {};
  var self = this;
  
  this.forEachField(function (name, field) {
    if (field.type === 'ref') {
      map[name] = yi.merge({
        table: self.getReferenceTable(field)
      }, field.prepare || {});
    }
  }, showFields);
  
  return map;
};

Schemas.prototype.isReference = function (name) {
  var field = this.getField(name);
  
  return field.type === 'ref';
};

Schemas.prototype.deleteFiles = function (record, changedFields, callback) {
  var self = this;
  var tasks = [];
  
  this.forEachField(function (name, field) {
    
    if (field.isImage && yi.isNotEmpty(record[name])) {
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
};

Schemas.prototype.convert = function (data, showFields) {
  
  this.forEachField(function (name, field) {
  
    switch (field.type) {
      case 'boolean':
        data[name] = data[name] === 'on';
        break;
    }
  
  }, showFields);

  return data;
};

Schemas.prototype.sanitize = function (data) {
  var sanitizer = require('sanitizer');
  var safe = {};
  
  this.forEachField(function (name, field) {
    
    if (data[name] === undefined) { return; }
    
    if (field.type == 'string') {
      safe[name] = sanitizer.sanitize(data[name]);
    } else {
      safe[name] = data[name];
    }
  
  });
  
  return safe;
};


Schemas.prototype.addValues = function (name, values) {
  this.fields[name].values = values;
};