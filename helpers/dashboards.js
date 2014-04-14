exports.render = render;

var Html = require('htmler');
var div = Html.div;
var h3 = Html.h3;
var p = Html.p;
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


function renderBox (name, properties, routes) {
  return div('dashboard-box').html(
    h3().html(
      a({href: routes.rootRoute()}).html(properties.title)
    ),
    p().html(properties.description || '')
  );
  
}