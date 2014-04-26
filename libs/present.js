exports.create = create;
exports.getFieldNames = getFieldNames;
exports.getFieldName = getFieldName;


var Html = require('htmler');
var Routes = require('./routes');

function create (config, record) {
  return new Present(config, record);
}

function Present (config, record) {
  this.routes = config.routes;
  this.schemas = config.schemas;
  this.showFields = config.showFields;
  this.record = record || {};
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

Present.prototype.link = function (name, value) {
  var ref;
  
  if (this.schemas.isReference(name)) {
    if (!this.record[name]) { return null; }
    ref = this.schemas.getReferenceTable(name);
    if ( ! this.referenceRoutes[ref] ) {
      this.referenceRoutes[ref] = Routes.create(this.routes.mount, ref);
    }
    // console.log(this.record);
    return linkElement(this.referenceRoutes[ref].viewRoute(this.record[name]._id), value, true);
  } else {
    return linkElement(this.routes.viewRoute(this.record._id), value);
  }
};

Present.prototype.strong = function (name) {
  var value = this.record[name];
  return Html.strong().html(value);
};

function linkElement (href, text, newWindow) {
  var prop;
  
  // console.log(arguments);
  if (text === undefined || text === null || text === '') {
    return '';
  }
  
  prop = { href: href };
  
  if (newWindow && text.indexOf('<img') == -1) {
    prop.target = '_blank';
    text = Html.span('glyphicon glyphicon-new-window').html() + ' ' + text;
  }
  return Html.a(prop).html(text);
}
