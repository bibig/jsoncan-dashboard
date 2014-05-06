exports.create = create;
exports.clear = clear;

var fs         = require('fs');
var rander     = require('rander');
var path       = require('path');
var async      = require('async');
var gm         = require('gm').subClass({ imageMagick: true });

function create (files, schemas) {
  return new Upload(files, schemas);
}

function clear (files, callback) {

  
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

  });
}

function fileExt (filename) {
  var info = filename.split('.');
  return info[info.length - 1];
}
  
function toRandomFile (source) {
  return [rander.string(6), fileExt(source)].join('.');
}


/////////////////////////
// upload class define //
/////////////////////////

function Upload (files, schemas) {
  this.files        = files || {};
  this.schemas      = schemas;
  this.data         = {};
}

Upload.prototype.forEachFile = function (callback) {
  var self = this;

  Object.keys(this.files).forEach(function (name) {
    callback(name, self.files[name]);
  });
};

Upload.prototype.noFileUpload = function () {
  var result = true;

  this.forEachFile(function (name, file) {
    if (!result) { return; }
    if (file.originalFilename !== '') {
      result = false;
    }
  });
  
  return result;
};

// waterfall steps:  validate -> save -> crop -> thumb

Upload.prototype.validate = function () {
  var self = this;
  var isPass = true;

  this.errors = {};
  
  this.forEachFile(function (name, file) {
    var message = self.schemas.checkFile(name, file);

    if (message !== true) {
      self.errors[name] = message;
      // console.log('ready to delete: %s', file.path);
      // fs.unlinkSync(file.path);
      isPass = false;
    }
  });
  
  return isPass;
};

Upload.prototype.clear = function (callback) {
  var self = this;
  // console.log(files);

  async.each(Object.keys(this.files || {}), function(name, next) {
    var file = self.files[name];
    
    // console.log('ready to delete: %s', file.path);
    fs.unlink(file.path, function (e) {

      if (e) {
        next(e);
      } else {
        next();
      }

    });

  }, callback);

};

// should be used after validate()
Upload.prototype.save = function (callback) {
  var self = this;
  var filenames = Object.keys(this.files);
  
  // console.log(filenames);
  async.each(filenames, function(name, callback) {
    
    async.series([
      function (callback) {
        var field = self.schemas.getField(name);

        checkFilePath(field.path, callback);
      },
      function (callback) {
        self.moveImage(name, callback);
      },
      function (callback) {
        self.trimImage(name, callback);
      },
      function (callback) {
        self.thumbImage(name, callback);
      }
    ], callback); // end of async.series
      
  }, callback); // end of async.each
};

Upload.prototype.moveImage = function (name, callback) {
  var file           = this.files[name];
  var field          = this.schemas.getField(name);
  var targetFileName = toRandomFile(file.path);
  var targetFile     = path.join(field.path, targetFileName);
  var self          = this;
  
  fs.rename(file.path, targetFile, function (e) {

    if (e) {
      callback(e);
    } else {
      self.data[name] = targetFileName;

      if (field.sizeField) {
        self.data[field.sizeField] = file.size;
      }

      callback();
    }
  });
};

Upload.prototype.trimImage = function (name, callback) {
  var field       = this.schemas.getField(name);
  var targetImage = path.join(field.path, this.data[name]);
  var imageSize   = field.imageSize;
  var gravities , gravity, imgObj;
  
  if (typeof imageSize == 'number') {
    imageSize = [imageSize];
  }
  
  if (Array.isArray(imageSize)) {
    imgObj = gm(targetImage);

    if (field.cropImage) {
      gravities = ['NorthWest', 'North', 'NorthEast', 'West', 'Center', 'East', 'SouthWest', 'South', 'SouthEast'];
      gravity = gravities.indexOf(field.cropImage) > -1 ? field.cropImage : 'North';
      imgObj = imgObj.gravity(gravity).crop(imageSize[0], imageSize[1]);
    } else {

      if (field.isFixedSize) {
        imgObj = imgObj.resize(imageSize[0], imageSize[1], '!');
      } else {

        if (imageSize.length == 2) {
          imgObj = imgObj.resize(imageSize[0], imageSize[1]);
        } else {
          imgObj = imgObj.resize(imageSize[0]);
        }

      }
    }
    
    imgObj.write(targetImage, callback);

  } else {
    callback();
  }
};

Upload.prototype.thumbImage = function (name, callback) {
  var field = this.schemas.getField(name);
  var targetImage, thumbPath, thumbImageObj, thumbSize;
  
  if (field.hasThumb) {
    targetImage   = path.join(field.path, this.data[name]);
    thumbPath     = this.schemas.thumbPath(field);
    thumbImageObj = path.join(thumbPath, this.data[name]);
    thumbSize     = field.thumbSize;
   
    if (typeof thumbSize == 'number') {
      thumbSize = [thumbSize];
    }
  
    if (Array.isArray(thumbSize)) {
      checkFilePath(thumbPath, function (e) {

        if (e) {
          callback(e);
        } else {
          gm(targetImage)
          .resize(thumbSize[0], thumbSize[1])
          .write(thumbImageObj, callback);  
        }

      });
    } else {
      callback();
    }
  } else {
    callback();
  }
};