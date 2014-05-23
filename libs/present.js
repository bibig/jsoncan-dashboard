/**
 * present value for a record
 */

exports.create        = create;
exports.getFieldNames = getFieldNames;
exports.getFieldName  = getFieldName;
exports.setCsrfAjax   = setCsrfAjax;
exports.addLink       = addLink;

var Html   = require('htmler');
var Routes = require('./routes');

function create (config, record) {
  return new Present(config, record);
}

function Present (config, record) {
  
  this.texts           = config.texts;
  this.routes          = config.routes;
  this.schemas         = config.schemas;
  this.showFields      = config.showFields;
  
  this.hasEditAction   = config.hasEditAction;
  this.hasAddAction    = config.hasAddAction;
  this.hasDeleteAction = config.hasDeleteAction;
  this.hasViewAction   = config.hasViewAction;
  
  this.token           = config.token;
  this.record          = record || {};
  this.referenceRoutes = {};
}

function getFieldNames (names) {
  var fieldNames = [];

  names.forEach(function (name) {
    fieldNames.push(getFieldName(name));
  });

  return fieldNames;
}

function getFieldName (name) {
  return name.split('|')[0].split('.')[0];
}

Present.prototype.showAll = function (fields) {
  var presents = [];
  var self     = this;
  
  fields = fields || this.showFields;
  
  fields.forEach(function (field) {
    presents.push(self.show(field));
  });
  
  return presents;
}; 

/**
 * show('avatar|thumb|link')
 */
Present.prototype.show = function (name) {
  var types        = name.split('|');
  var baseInfo     = types.shift().split('.');
  var fieldName    = baseInfo[0];
  var refFieldName = baseInfo[1];
  var present      = this.record[fieldName];
  var self         = this;
  var typeInfo;
  
  if ( ! present ) { return ''; }

  if (refFieldName) {

    if (this.record[fieldName]) {
      present = this.record[fieldName][refFieldName];
    } else {
      present = null;
    }

  } else {
    present = this.record[fieldName];
  }

  types.forEach(function (type) {

    typeInfo = type.split('_');

    switch (typeInfo[0]) {
      case 'image':
        present = self.image(fieldName);
        break;
      case 'thumb': // thumb_100x100
        present = self.thumb(fieldName, typeInfo[1]);
        break;
      case 'thumbs':
        present = Html.div('thumbnails-box').html(self.thumbs(fieldName).join(''));
        break;
      case 'strong':
        present = self.strong(fieldName);
        break;
      case 'link':
        present = self.link(fieldName, present);   
        break;
    }
  });
  
  return present;
};

Present.prototype.getFieldText = function (name) {
  var types     = name.split('|');
  var fieldName = getFieldName(name);
  var field     = this.schemas.getField(fieldName);
  var text      = field.text || field.name;

  if (types.length === 1) {
    return text;
  }

  if (types[1] == 'thumb' || types[1] == 'thumbs') {
    return text + '(' + this.texts.thumb + ')';
  }

  return text;
};

Present.prototype.getFieldName = getFieldName;

Present.prototype.image = function (name) {
  var filename = this.record[name];
  var src = this.schemas.imageSrc(name, filename);

  return Html.img({src: src});
};

Present.prototype.thumb = function (name, size) {
  var filename = this.record[name];
  var src = this.schemas.thumbSrc(name, filename, size);

  return Html.img({src: src});
};

Present.prototype.thumbs = function (name) {
  var filename = this.record[name];
  var list = this.schemas.allThumbs(name, filename) || [];
  var images = [];

  list.forEach(function (thumb) {
    images.push(Html.img({src: thumb.src}));
  });

  return images;
};

Present.prototype.link = function (name, text) {
  var ref;
  
  if (this.schemas.isReference(name)) {
    // if (!this.record[name]) { return null; }
    return this.refViewLink(name, text);
  } else {
    return this.viewLink(text);
  }
};

Present.prototype.strong = function (name) {
  var value = this.record[name];

  return Html.strong().html(value);
};

Present.prototype.editLink = function (isButton) {
  var prop, text;
  
  if ( ! this.hasEditAction ) { return null; }

  text = this.texts.edit;
  prop = {
    href: this.routes.editRoute(this.record._id)
  };
  
  if (isButton) {
    prop['class'] = 'btn btn-warning';
    text = Html.span('glyphicon glyphicon-wrench').html() + ' ' + text;
  }
  
  return Html.a(prop).html(text);
};

Present.prototype.uploadLink = function (name, extraText, isButton) {
  var text = this.texts.upload + extraText;
  var prop = {
    href: this.routes.uploadRoute(name, this.record._id)
  };

  if (isButton) {
    prop['class'] = 'btn btn-info';
    text = Html.span('glyphicon glyphicon-cloud-upload').html() + ' ' + text;
  }

  return Html.a(prop).html(text);
};

Present.prototype.deleteLink = function (isButton) {
  var prop, text;
  
  if ( ! this.hasDeleteAction ) { return null; }
  
  text = this.texts.delete;
  prop = {
    href: '#',
    onclick: 'jd.del(\'' + this.routes.deleteRoute(this.record._id) + '\');'
  };
  
  if (isButton) {
    prop['class'] = 'btn btn-danger';
    text = Html.span('glyphicon glyphicon-trash').html() + ' ' + text;
  }
  
  return Html.a(prop).html(text);
};

Present.prototype.addLink = function (isButton, extraClass) {
  var q = {}, self = this;
  
  if ( ! this.hasAddAction ) { return null; }
  
  this.schemas.forEachRefField(function (name) {

    if (self.record[name] !== undefined && self.record[name] !== null && self.record[name] !== '') {
      q[name] = self.record[name]._id;
    }

  });
  
  return addLink(this.routes.addRoute(q), this.texts.add, isButton, extraClass);
};


function addLink (url, text, isButton, extraClass) {
  var prop = {
    href: url
  };
  
  if (isButton) {
    prop['class'] = 'btn btn-success' ;
    if (extraClass)  { prop['class'] += ' ' + extraClass; }
    text = Html.span('glyphicon glyphicon-plus').html() + ' ' + text;
  }
  
  return Html.a(prop).html(text);
}

Present.prototype.viewLink = function (text) {
  if (this.hasViewAction) { return null; }
  
  return Html.a({href: this.routes.viewRoute(this.record._id)}).html(text || this.texts.view);
};

Present.prototype.refViewLink = function (name, text) {
  var ref = this.schemas.getReferenceTable(name);
  var prop;
  
  if ( ! this.referenceRoutes[ref] ) {
    this.referenceRoutes[ref] = Routes.create(this.routes.mount, ref);
  }
  
  if (text === undefined || text === null || text === '') {
    return '';
  }
  
  prop = {
    href: this.referenceRoutes[ref].viewRoute(this.record[name]._id),
    target: '_blank'
  };
  
  if (text.indexOf('<img') == -1) {
    prop.target = '_blank';
  }
  
  return Html.a(prop).html(
    Html.span('glyphicon glyphicon-new-window').html(),
    ' ',
    text
  );
};

function setCsrfAjax (config) {
  return config.token ? Html.script().html('$(function () { jd.setCsrf("' + config.token + '"); });') : '';
}
