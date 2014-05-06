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
  var self = this;
  
  fields = fields || this.showFields;
  
  fields.forEach(function (field) {
    presents.push(self.show(field));
  });
  
  return presents;
}; 

/**
 * show('image|thumb|link', {}, schemas)
 */
Present.prototype.show = function (name) {
  var types = name.split('|');
  var baseInfo = types.shift().split('.');
  var fieldName = baseInfo[0];
  var refFieldName = baseInfo[1];
  var present = this.record[fieldName];
  var self = this;
  
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

    switch (type) {
      case 'image':
        present = self.image(fieldName);
        break;
      case 'thumb':
        present = self.thumb(fieldName);
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

Present.prototype.getFieldName = getFieldName;

Present.prototype.image = function (name) {
  var filename = this.record[name];
  var src = this.schemas.imageSrc(name, filename);

  return Html.img({src: src});
};

Present.prototype.thumb = function (name) {
  var filename = this.record[name];
  var src = this.schemas.thumbSrc(name, filename);

  return Html.img({src: src});
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
  
  text = '编辑';
  prop = {
    href: this.routes.editRoute(this.record._id)
  };
  
  if (isButton) {
    prop['class'] = 'btn btn-warning';
    text = Html.span('glyphicon glyphicon-wrench').html() + ' ' + text;
  }
  
  return Html.a(prop).html(text);
};

Present.prototype.deleteLink = function (isButton) {
  var prop, text;
  
  if ( ! this.hasDeleteAction ) { return null; }
  
  text = '删除';
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
  
  return addLink(this.routes.addRoute(q), isButton, extraClass);
};


function addLink (url, isButton, extraClass) {
  var text = '新增';
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
  
  return Html.a({href: this.routes.viewRoute(this.record._id)}).html(text || '查看');
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
