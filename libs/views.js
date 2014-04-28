module.exports = exports = Views;

var path = require('path');
var Htmler = require('htmler');

function Views (controller) {
  this.controller = controller;
  this.viewPath = this.controller.dashboards.settings.viewPath;
}

Views.prototype.viewFile = function (name) {
  var view = this.controller.actions[name].view;
	if (view) {
		return view;	
	} else {
		return path.join(this.viewPath, this.controller.actions[name].viewName || this.getDefaultViewName(name));
	}
};

Views.prototype.getDefaultViewName = function (name) {
  switch (name) {
    case 'add':
      return 'edit.html';
    default:
      return name + '.html';
  }
};

Views.prototype.render = function (res, name, locals) {
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
	  layers.push(title);
	}
	
	locals.pageTitle = locals.pageTitle || title;
	locals.breadcrumbs = this.breadcrumbs(layers);
	// console.log(locals);
	res.render(this.viewFile(name), locals);
};

Views.prototype.viewTitle = function (name) {
  var title = this.controller.actions[name].title;
  var modelTitle;
  
  if (title) { return title; }
	
	modelTitle  = this.controller.settings.title;
  switch (name) {
    case 'view':
      return '浏览' + modelTitle;
      break;
    case 'add':
      return '新增' + modelTitle;
      break;
    case 'edit':
      return '编辑' + modelTitle;
      break;
    case 'list':
      return modelTitle + '清单';
    default:
      return null;
  }
};

Views.prototype.breadcrumbs = function (layers) {
	var ol = Htmler.ol;
	var li = Htmler.li;
	var a = Htmler.a;
	var list = [
		li().html(a({href: this.controller.routes.mount}).html(this.controller.dashboards.settings.title))
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