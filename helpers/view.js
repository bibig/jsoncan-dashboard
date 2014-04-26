exports.render = render;

var Present = require('../libs/present');
var Html = require('htmler');
var table = Html.table;
// var tbody = Html.tbody;
// var thead = Html.thead;
var tr = Html.tr;
var td = Html.td;
var th = Html.th;
var a = Html.a;
var span = Html.span;
var List = require('./list');
var Media = require('./media');

function render (record, config) {
	var rows = [];
	var scriptHtml = '';
	var schemas = config.schemas;
	var links = [];
	// var editLink, deleteLink, addLink;
	var hasManyPartHtml;
	var scripts = [];
	var present = Present.create(config, record);
	
	config.showFields.forEach(function (name) {
	  var fieldName = Present.getFieldName(name);
	  var field = schemas.getField(fieldName);
    
    if (field) {
      rows.push(tr().html(
        th({ width: '12%' }).html(field.text || field.name),
        td().html(present.show(name))
      ));
    }
	});
	
	if (config.hasMany) {
	  switch (config.hasMany.style) {
	    case 'media':
	      hasManyPartHtml = Media.render(record[config.hasMany.table], config.hasMany);
	      break;
	    case 'list':
	    default:
	      hasManyPartHtml = List.renderUl(record[config.hasMany.table], config.hasMany);
	  }
	  
	  rows.push(tr().html(
	    th().html(config.hasMany.title),
	    td().html(hasManyPartHtml)
	  ));
	}
	
	if (config.hasEditAction) {
	  links.push(a({href: config.routes.editRoute(record._id), class: 'btn btn-warning'}).html(
	    Html.span('glyphicon glyphicon-wrench').html(),
	    ' 编辑'
	  ));
	}
	
	if (config.hasDeleteAction) {
	  links.push(a({href: '#', 'onclick': 'jd.del(\'' + config.routes.deleteRoute(record._id) + '\');', class: 'btn btn-danger'}).html(
	    Html.span('glyphicon glyphicon-trash').html(),
	    ' 删除'
	  ));
	}
	
	if (config.hasAddAction) {
	  links.push(a({href: config.routes.addRoute(), class: 'btn btn-success'}).html(
	    Html.span('glyphicon glyphicon-plus').html(),
	    ' 新增'
	  ));
	}
	
	rows.push(
		tr().html(
			th().html(),
			td().html(links.join('&nbsp;'))
		)
	);	
	
	if (config.token) {
	  scriptHtml = Html.script().html('$(function () { jd.setCsrf("' + config.token + '"); });');
	}

	return table('table table-bordered table-record').html(rows) + scriptHtml;
}