exports.renderTable = renderTable;
exports.renderFilterDropdown = renderFilterDropdown;
exports.renderTitle = renderTitle;
exports.renderUl = renderUl;
exports.renderAddLink = renderAddLink;

// var Schemas = require('../libs/schemas');
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
    
      present.showAll().forEach(function (ele) {
        trHtml += td().html(ele);
      });
    
      links.push(a({href: routes.viewRoute(record._id)}).html('查看'));
    
      if (config.hasEditAction) {
        links.push(a({href: routes.editRoute(record._id)}).html('编辑'));
      }
    
      if (config.hasDeleteAction) {
        links.push(a({href: '#', 'onclick': 'jd.del(\'' + routes.deleteRoute(record._id) + '\');'}).html('删除'));
      }
    
      trHtml += td().html(links.join('&nbsp;|&nbsp;'));
    
      tableBodyHtml += tr().html(trHtml);
    });
   
    if (config.token) {
      scriptHtml = Html.script().html('$(function () { jd.setCsrf("' + config.token + '"); });');
    }
    
  } else {
    colspan = config.showFields.length + 1;
    tableBodyHtml = tr().html(td({colspan: colspan}).html(
      Html.p('text-center').html('还没有记录')
    ))
  }

	return table('table table-striped').html(
		thead().html(tableHeadHtml),
		tbody().html(tableBodyHtml)
	) + scriptHtml;
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
    
    if (text.length > 15) {
      text = text.substring(0, 11) + '...';
    }
    
    if (record._id == config.currentValue) {
      klass = 'active';
      items.push(li('active').html(a({href: '#'}).html(text)));
    } else {
      q[config.qname] = record._id;
      items.push(li().html(a({href: config.routes.listRoute(1, q)}).html(text)));
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

function renderAddLink (url, text) {
  var cls = 'btn btn-large btn-success';
  if ( ! url ) {
    url = '#';
    cls += ' disabled';
  }
  
  return a({class: cls, href: url}).html(
    Html.span('glyphicon glyphicon-plus').html(),
    ' ',
    text || '新增'
  );
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