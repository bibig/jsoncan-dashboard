
exports.render = render;

var Icons = require('./icons');
var Html  = require('htmler');
var yi    = require('yi');

function render (config) {
  var links;

  if (Array.isArray(config) && yi.isNotEmpty(config)) {
    links = [];

    config.forEach(function (item) {
      links.push(_render(item));
    });

    return links;
  }

  return _render(config);
}

function _render (s) {
  var arr  = s.split('|');
  var icon = '';
  var prop = {};
  var text;

  if (arr.length < 2) { return arr[0]; }

  prop.href = arr.shift();

  arr.forEach(function (item) {
    var info = item.split(':');

    if (info.length == 1) { 
      text = item; 
      return; 
    }

    switch (info[0]) {
      case 'i':
        icon = info[1];
        break;
      case '.':
        prop.class = info[1];
        break;
      case '#':
        prop.id = info[1];
        break;
      case 't':
        text = info[1];
        break;
      default:
        prop[info[0]] = info[1];
    }

  });

  if (icon) {
    icon = Icons.render(icon) + ' ';
  }

  return Html.a(prop).html(icon + text);
}

