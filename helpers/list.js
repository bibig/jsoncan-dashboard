exports.renderTable = renderTable;
exports.renderFilterDropdown = renderFilterDropdown;
exports.renderTitle = renderTitle;
exports.renderUl = renderUl;
exports.renderAddLink = renderAddLink;

var Present = require('../libs/present');
var Html = require('htmler');
var div = Html.div;
var table = Html.table;
var thead = Html.thead;
var tbody = Html.tbody;
var tr = Html.tr;
var td = Html.td;
var th = Html.th;
var a = Html.a;
var ul = Html.ul;
var li = Html.li;
var span = Html.span;

/**
 * needed args:
 *  schemas
 *  showFields
 *  links (link makers)
 *  readonly
 */
function renderTable (records, config) {
	var tableHeadHtml = '';
	var tableBodyHtml = '';
	var schemas = config.schemas;
	var routes = config.routes;
	var scriptHtml = '';
	var colspan;
	
	schemas.forEachField(function (name, field) {
		tableHeadHtml += th().html(field.text ? field.text : field.name);
	}, Present.getFieldNames(config.showFields));
	
	if (!config.readonly) {
  	tableHeadHtml += th().html('操作');
  }
	tableHeadHtml = tr().html(tableHeadHtml);

  if (records.length > 0) {
    records.forEach(function (record) {
      var trHtml = '';
      var links = [];
      var present = Present.create(config, record);
      var viewLink, editLink, deleteLink;
    
      present.showAll().forEach(function (ele) {
        trHtml += td().html(ele);
      });
      
      viewLink = present.viewLink();
      editLink = present.editLink();
      deleteLink = present.deleteLink();
    
      if (viewLink) {  links.push(viewLink); }
      if (editLink) {  links.push(editLink); }
      if (deleteLink) {  links.push(deleteLink); }
    
      trHtml += td().html(links.join('&nbsp;|&nbsp;'));
    
      tableBodyHtml += tr().html(trHtml);
    });
    
  } else {
    colspan = config.showFields.length + 1;
    tableBodyHtml = tr().html(td({colspan: colspan}).html(
      Html.p('text-center').html('还没有记录')
    ))
  }

	return table('table table-striped').html(
		thead().html(tableHeadHtml),
		tbody().html(tableBodyHtml)
	) + Present.setCsrfAjax(config);
}

function renderFilterDropdown (records, config) {
  var span = Html.span;
  var btn = Html.button({type: 'button', class: 'btn btn-info dropdown-toggle', 'data-toggle': 'dropdown'}).html(
    span('glyphicon glyphicon-filter').html(),
    ' ',
    config.title, 
    ' ',
    span('caret').html()
  );
  var items = [];
  var ulHtml;
  
  records.forEach(function (record) {
    var q = {};
    var text = record[config.textField];
    var showText = text;
    
    if (text.length > 15) {
      showText = text.substring(0, 11) + '...';
    }
    
    if (record._id == config.currentValue) {
      klass = 'active';
      items.push(li('active').html(a({href: '#', title: text}).html(showText)));
    } else {
      q[config.qname] = record._id;
      items.push(li().html(a({href: config.routes.listRoute(1, q), title: text}).html(showText)));
    }
  });
  
  if (items.length > 0) {
    items.unshift(li().html(a({href: config.routes.listRoute()}).html('所有记录')) + li('divider').html());
    
    return div('btn-group text-left').html(
      btn,
      ul({class: 'dropdown-menu', role: 'menu'}).html(items)
    );
  } else {
    return '';
  }
}

function renderUl (records, config) {
  var liHtmls = [];
  records.forEach(function (record ) {
    var present = Present.create(config, record);
    liHtmls.push(
      li().html(
        present.show(config.viewLinkField)
      )
    );
  });
  return ul('list-unstyled').html(liHtmls);
}

// ready to move into present
function renderAddLink (url, text) {
  var cls = 'btn-large';
  if ( ! url ) {
    url = '#';
    cls += ' disabled';
  }
  
  return Present.addLink(url, true, cls);
}

function renderTitle (title, addLink, queryDropdown) {
  var h1 = Html.h1;
  
  return div('row').html(
    div('col-md-6').html(h1().html(title)),
    div('col-md-6').html(
      h1('text-right').html(
        queryDropdown || '',
        '&nbsp;',
        addLink
      )
    )
  );
}