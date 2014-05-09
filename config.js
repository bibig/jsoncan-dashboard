exports.create = create;

var path = require('path');
var yi   = require('yi');

var Config = {
    mount       : '',
    viewMount   : '',  // important, for static source url
    staticRoot  : '/dashboards-assets',  // the route app serve the static files
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
function create (settings) {
  var BH          = require('bootstrap-helper');  
  var currentDate = new Date();
  var config      = yi.merge(settings, yi.clone(Config));
  
  if (! config.viewMount && config.mount ) { config.viewMount = config.mount; }

  config.javascripts.base = path.join(config.viewMount, config.staticRoot, '/javascripts/jsoncan-dashboard.js');
  config.stylesheets.base = path.join(config.viewMount, config.staticRoot, '/stylesheets/admin.css');
  config.mainToolbars     = [ path.join(config.viewMount + '/') + '|i:th|' + config.title ];


  config.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  // prepare for logo
  if (yi.isNotEmpty(config.logo)) {
    config.logo = BH.anchors.render(config.logo);
  }

  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(config.mainToolbars)) {
    config.mainToolbars = BH.anchors.render(config.mainToolbars); 
  }

  if (yi.isNotEmpty(config.rightToolbars)) {
    config.rightToolbars = BH.anchors.render(config.rightToolbars);
  }

  if (yi.isNotEmpty(config.footbars)) {
    config.footbars = BH.anchors.render(config.footbars);
  }

  return config;
}