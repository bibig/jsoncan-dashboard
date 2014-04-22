exports.render = render;

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
	var editLink, deleteLink, addLink;
	var hasManyPartHtml;
	var scripts = [];
	
	record = record || {};
	
	//console.log(config.showFields);
	schemas.forEachField(function (name, field) {
		var value = record[field.name];
		if (value === undefined && value === '') {
		  value = null;
		}

		rows.push(tr().html(
			th().html(field.text || field.name),
			td().html(schemas.presentValue(name, value))
		));
	}, config.showFields);
	
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
	
	editLink = config.links.edit ? a({href: config.links.edit, class: 'btn btn-warning'}).html('编辑') : '';
	deleteLink = config.links.delete ? a({href: '#', 'onclick': 'jd.del(\'' + config.links.delete + '\');', class: 'btn btn-danger'}).html('删除') : '';
	addLink = config.links.add ? a({href: config.links.add, class: 'btn btn-success'}).html('新增') : '';
	
	rows.push(
		tr().html(
			td().html(),
			td().html(
				editLink,
				span().html('&nbsp;'),
				deleteLink,
				span().html('&nbsp;'),
				addLink
			)
		)
	);	
	
	if (config.token) {
	  scriptHtml = Html.script().html('$(function () { jd.setCsrf("' + config.token + '"); });');
	}

	return table('table table-bordered table-record').html(rows) + scriptHtml;
}