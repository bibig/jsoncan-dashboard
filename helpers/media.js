exports.render = render;

var Html = require('htmler');
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


function render (records, config) {
  var max = records.length;
  var cols = config.cols || 3;
  
  
  for (var i = 0; i < max; i++) {
    
  }
}