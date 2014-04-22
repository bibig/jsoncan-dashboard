exports.render = render;

var Grids = require('./grids');
var Html = require('htmler');
var a = Html.a;
var div = Html.div;

function render (records, config) {
  var items = [];
  // console.log(records);
  // console.log(config);
  records.forEach(function (record ) {
    var name = config.schemas.getRealName(config.viewLinkField);
    var value = record[name];
    var media = config.schemas.presentValue(config.viewLinkField, value);
    var link = a({href: config.links.view(record._id)}).html(media);
    
    items.push(div('media-box').html(link));
  });
  return Grids.render(items, 4);
}