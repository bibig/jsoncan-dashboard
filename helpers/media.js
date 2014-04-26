exports.render = render;

var Present = require('../libs/present');
var Grids = require('./grids');
var Html = require('htmler');
var a = Html.a;
var div = Html.div;

function render (records, config) {
  var images = '';
  
  records.forEach(function (record ) {
    var present = Present.create(config, record);
    var link = present.show(config.viewLinkField);
    images += div('media-box pull-left').html(link);
  });
  
  return div('media-panel').html(
    images,
    div('clearfix').html()
  );
}