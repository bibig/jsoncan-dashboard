exports.renderDashboards = renderDashboards;
exports.render = render;
exports.renderCols = renderCols;

var Html = require('htmler');
var div = Html.div;
var h3 = Html.h3;
var p = Html.p;
var a = Html.a;
var ul = Html.ul;
var li = Html.li;
var span = Html.span;

function renderDashboards (modules, routesMap) {
  var names = Object.keys(modules);
  var items = [];
  
  names.forEach(function (name) {
    items.push(renderDashboard(name, modules[name], routesMap[name]));
  });
  
  return render(items);
}

/*
function render (modules, routesMap) {
  var names = Object.keys(modules);
  var items = [];
  var colNum = 3;
  var cols = [];
  var body = '';
  
  for (var i = 0; i < colNum; i++) {
    cols[i] = [];
  }
  
  for (var i = 0; i < names.length; i++) {
    cols[i % colNum].push(renderBox(names[i], modules[names[i]], routesMap[names[i]]));
  }
  
  for (var i = 0; i < colNum; i++) {
    body += div('col-md-' + (12 / colNum)).html(cols[i]);
  }
  
  return div('row').html(body);
}
*/

function renderDashboard (name, properties, routes) {
  var cls = ['dashboard-box'];
  if (properties.style) {
    cls.push(properties.style);
  }
  return div(cls).html(
    h3().html(
      a({href: routes.rootRoute()}).html(properties.title)
    ),
    p().html(properties.description || '')
  );
}

function render (items, colNum) {
  var body = '';
  var cols = [];
  
  colNum = colNum || 3;
  
  for (var i = 0; i < colNum; i++) {
    cols[i] = [];
  }
  
  for (var i = 0; i < items.length; i++) {
    cols[i % colNum].push(items[i]);
  }
  
  for (var i = 0; i < colNum; i++) {
    body += div('col-md-' + (12 / colNum)).html(cols[i]);
  }
  
  return div('row').html(body); 
}

function renderCols (items) {
  var body = '';
  var cols = items.length;
  var eachCol = Math.floor(12 / cols);
  
  for (var i = 0; i < cols; i++) {
    body += div('col-md-' + eachCol).html(items[i]);
  }
  
  return div('row').html(body); 
}