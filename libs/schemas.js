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

function getThumbFilename (imageFile, size) {
  var info;

  if ( ! size ) { return imageFile; }

  info = imageFile.split('.');

  return info[0] + '_' + size + '.' + info[1];
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

// none file type
Schemas.prototype.noFileInputFields = function () {
  var list = [];

  this.forEachField(function (name, field) {
    list.push(name);
  }, function (name, field) {
    return field.isInput && field.inputType != 'file';
  });

  return list;
};

Schemas.prototype.noTextareaInputFields = function () {
  var list = [];

  this.forEachField(function (name, field) {

  }, function (name, field) {
    return field.isInput && ['textarea', 'rich_textarea'].indexOf(field.inputType) === -1;
  });
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

Schemas.prototype.forEachFileField = function (callback) {
  this.forEachField(callback, function (name, field) {
    return field.inputType == 'file';
  });
};

Schemas.prototype.getFileFields = function (whiteList) {
  var files = {};

  this.forEachField(function (name, field) {
    if (field.inputType == 'file') {
      files[name] = yi.filter(field, ['required', 'isRequired', 'isImage', 'path', 'maxFileSize', 'exts', 'sizeField', 'cropImage', 'isFixedSize', 'imageSize', 'thumbs', 'thumbPath']);
    }
  }, whiteList);

  return files;
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

// for old version
Schemas.prototype.thumbSrc = function (name, value, size) {
  var field = this.getField(name);

  return path.join(this.thumbUrl(field), getThumbFilename(value, size));
};

Schemas.prototype.allThumbs = function (name, value) {
  var thumbs    = [];
  var field     = this.getField(name);
  var thumbUrl  = this.thumbUrl(field);
  var thumbPath = this.thumbPath(field);
  var sizes     = field.thumbs;

  if ( ! sizes ) { sizes.push(''); }

  sizes.forEach(function (size) {
    var filename = getThumbFilename(value, size);

    thumbs.push({
      src: path.join(thumbUrl, filename),
      file: path.join(thumbPath, filename)
    });
  });

  return thumbs;
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
  var files = [];
  
  // find out which files need to delete
  this.forEachField(function (name, field) {
    var value = record[name];

    if (field.inputType == 'file' && yi.isNotEmpty(value)) {
      files.push(path.join(field.path, value));

      if (field.thumbs) {
        self.allThumbs(name, value).forEach(function (thumb) {
          files.push(thumb.file);
        });
      }

    }

  }, changedFields);

  async.each(files, function (file, callback) {
    fs.exists(file, function (exists) {
      if (exists) {
        fs.unlink(file, callback);
      } else {
        callback();
      }
    });
  }, callback);
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