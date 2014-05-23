exports.create   = create;


var path    = require('path');
var Html    = require('htmler');
var yi      = require('yi');
var Helpers = require('../helpers');

function create (controller) {
  return new Views(controller);
}

///////////////////////
// View class define //
///////////////////////

function Views (controller) {
  this.texts = controller.texts;
  this.controller = controller;
}

Views.prototype.viewFile = function (name) {
  var settings = this.controller.settings[name];
  var view     = settings.view;
  var viewPath, viewName;

	if ( ! view ) {
    viewPath = this.controller.dashboards.config.viewPath;
    viewName = settings.viewName || this.getDefaultViewName(name);

    if (viewPath) {
      view = path.join(viewPath, viewName);
    } else {
      view = viewName;
    }
	}

  return view;
};

Views.prototype.getDefaultViewName = function (name) {
  
  switch (name) {
    case 'add':
    case 'upload':
      return 'edit.html';
    default:
      return name + '.html';
  }

};

Views.prototype.render = function (res, name, locals, _id) {
  var title = this.viewTitle(name);
  var layers = [];
  
	if (!locals.pageTitle) {
		locals.pageTitle = title;
	}
	
	if (name == 'list') {
	  layers.push(title);
	} else {

	  if (this.controller.hasListAction) {
	    layers.push([this.controller.routes.listRoute(), this.viewTitle('list')]);
	  }

    if (name == 'upload' || name == 'edit') {
     layers.push([this.controller.routes.viewRoute(_id), this.viewTitle('view')]); 
    }

	  layers.push(title);
	}
	
	locals.pageTitle = locals.pageTitle || title;
	locals.breadcrumbs = this.breadcrumbs(layers);
	// console.log(locals);
	res.render(this.viewFile(name), locals);
	// res.render(this.getDefaultViewName(name), locals);
};

Views.prototype.viewTitle = function (name) {
  var title = this.controller.settings[name].title;
  var modelTitle;
  
  if (title) { return title; }
	
	modelTitle  = this.controller.settings.basic.title;

  switch (name) {
    case 'view':
      return this.texts.browser + modelTitle;
    case 'add':
      return this.texts.add;
    case 'edit':
      return this.texts.edit;
    case 'upload':
      return this.texts.upload_file;
    case 'list':
      return modelTitle + this.texts.list;
    default:
      return null;
  }

};

Views.prototype.breadcrumbs = function (layers) {
  var ol   = Html.ol;
  var li   = Html.li;
  var a    = Html.a;
  var list = [
		li().html(a({href: this.controller.routes.mount}).html(this.controller.dashboards.config.title))
	];
	
	layers.forEach(function (layer) {
		
    if (Array.isArray(layer)) {
			list.push(li().html(a({href: layer[0]}).html(layer[1])));
		} else {
			list.push(li('active').html(layer));
		}

	});
	
	return ol('breadcrumb').html(list);
};