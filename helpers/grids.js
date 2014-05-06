
exports.renderDashboards    = renderDashboards;
exports.render              = render;
exports.renderCols          = renderCols;
exports.renderColsByAverage = renderColsByAverage;

var Html = require('htmler');
var div  = Html.div;
var h3   = Html.h3;
var p    = Html.p;
var a    = Html.a;
var ul   = Html.ul;
var li   = Html.li;
var span = Html.span;

/**
 * [renderDashboards description]
 * ...
 * @author bibig@me.com
 * @update [date]
 * @param  {[type]} tables
 * @param  {[type]} routesMap
 * @return {[type]}
 */
function renderDashboards (tables, routesMap) {
  var names = Object.keys(tables);
  var items = [];
  
  names.forEach(function (name) {
    items.push(renderDashboard(name, tables[name], routesMap[name]));
  });
  
  return render(items);
}

function renderDashboard (name, config, routes) {
  var cls   = ['dashboard-box'];
  var basic = config.basic;

  if (basic.style) {
    cls.push(basic.style);
  }
  return div(cls).html(
    h3().html(
      a({href: routes.rootRoute()}).html(basic.title)
    ),
    p().html(basic.description || '')
  );
}

function render (items, colNum) {
  var body = '';
  var cols = [];
  var i;
  
  colNum = colNum || 3;
  
  for (i = 0; i < colNum; i++) {
    cols[i] = [];
  }
  
  for (i = 0; i < items.length; i++) {
    cols[i % colNum].push(items[i]);
  }
  
  for (i = 0; i < colNum; i++) {
    body += div('col-md-' + (12 / colNum)).html(cols[i]);
  }
  
  return div('row').html(body); 
}

function renderColsByAverage (items) {
  var body = '';
  var cols = items.length;
  var eachCol = Math.floor(12 / cols);
  
  for (var i = 0; i < cols; i++) {
    body += div('col-md-' + eachCol).html(items[i]);
  }
  
  return div('row').html(body); 
}

function renderCols (items, cols) {
  var body = '';
  var i = 0;

  for (i = 0; i < items.length; i++) {
    body += div('col-md-' + cols[i]).html(items[i]);
  }

  return div('row').html(body);
}