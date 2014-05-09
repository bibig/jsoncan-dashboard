exports.create = create;

var path = require('path');
var yi   = require('yi');

var config = {
  title       : 'dashboards',
  favicon     : path.join(__dirname, './public/images/favicon.ico'),
  javascripts : {
    jquery    : '//ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.0.min.js',
    tinymce   : '//tinymce.cachefly.net/4.0/tinymce.min.js',
    bootstrap : '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js',
    
  },
  stylesheets : {
    bootstrap : '//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css',
    fa        : '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css'
  }  
};

// all local url should added viewMount and staticRoot
function create (viewMount, staticRoot) {

  config.javascripts.base = path.join(viewMount, staticRoot, '/javascripts/jsoncan-dashboard.js');
  config.stylesheets.base = path.join(viewMount, staticRoot, '/stylesheets/admin.css');
  config.mainToolbars     = [ path.join(viewMount + '/') + '|i:th|' + config.title ];

  return yi.clone(config);
}