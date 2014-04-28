exports.render = render;

var Present = require('../libs/present');
var Html = require('htmler');
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
	var editLink, deleteLink, addLink;
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
	
	editLink = present.editLink(true);
	deleteLink = present.deleteLink(true);
	addLink = present.addLink(true);
	
	if (editLink) { links.push(editLink); }
	if (deleteLink) { links.push(deleteLink); }
	if (addLink) { links.push(addLink); }
	
	rows.push(
		tr().html(
			th().html(),
			td().html(links.join('&nbsp;'))
		)
	);	

	return Html.table('table table-bordered table-record').html(rows) + Present.setCsrfAjax(config);
}