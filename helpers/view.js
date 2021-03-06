exports.render = render;

var Present = require('../libs/present');
var Html    = require('htmler');
var tr      = Html.tr;
var td      = Html.td;
var th      = Html.th;
var a       = Html.a;
var span    = Html.span;
var List    = require('./list');
var Media   = require('./media');

function render (record, config) {
  var rows       = [];
  var scriptHtml = '';
  var schemas    = config.schemas;
  var links      = [];
  var scripts    = [];
  var present    = Present.create(config, record);
  var tableId    = 'view-' + config.tableName;
  var editLink, deleteLink, addLink, hasManyPartHtml;

  config.showFields.forEach(function (name) {
    var fieldName = Present.getFieldName(name);
    var field = schemas.getField(fieldName);
    
    if (field) {
      rows.push(tr().html(
        th({ width: '12%', class: 'th-' + field.name }).html(present.getFieldText(name)),
        td('td-' + field.name).html(present.show(name))
      ));
    }

  });
  
  if (config.hasMany) {
    
    switch (config.hasMany.style) {
      case 'media':
        hasManyPartHtml = Media.render(record[config.hasMany.table], config.hasMany);
        break;
      default: // list
        hasManyPartHtml = List.renderUl(record[config.hasMany.table], config.hasMany);
    }
    
    rows.push(tr().html(
      th().html(config.hasMany.title),
      td().html(hasManyPartHtml)
    ));
  }

  // create upload links
  config.schemas.forEachFileField(function (name, field) {
    links.push(present.uploadLink(name, field.text, true));
  });
  
  editLink   = present.editLink(true);
  deleteLink = present.deleteLink(true);
  addLink    = present.addLink(true);
  
  if (editLink) { links.push(editLink); }

  if (deleteLink) { links.push(deleteLink); }
  
  if (addLink) { links.push(addLink); }
  
  rows.push(
    tr().html(
      th().html(),
      td().html(links.join('&nbsp;'))
    )
  );  

  return Html.table({id: tableId, class: 'table table-bordered table-record'}).html(rows) + Present.setCsrfAjax(config);
}