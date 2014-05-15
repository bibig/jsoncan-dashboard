exports.create = create;

var path = require('path');
var yi   = require('yi');

var Config = {

  views      : path.join(__dirname, './views'),
  staticRoot : '/dashboards-assets',  // the route app serve the static files
  staticPath : path.join(__dirname, './public'),
  
  csrf       : true,

  multipart: {
    maxFilesSize : 20 * 1024 * 1024,
    uploadDir    : path.join(__dirname, './tmp')
  },

  mount       : '',
  viewMount   : '',  // important, for static source url
  

  cookieSecret : 'dashboards',
  session: {
    keys   : ['jsoncan', 'dashboards'],
    maxAge : 60 * 60 * 1000
  }, 

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
  },
  messages: {
    'success-delete' : '成功删除一条记录',
    'success-add'    : '成功新增一条记录',
    'success-edit'   : '成功修改记录'
  }  
};

// all local url should added viewMount and staticRoot
function create (settings) {
  var BH          = require('bootstrap-helper');  
  var currentDate = new Date();
  var config      = yi.merge(settings, yi.clone(Config));
  
  if ( ! config.viewMount && config.mount ) { config.viewMount = config.mount; }

  config.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  if ( ! config.javascripts.base ) {
    config.javascripts.base = path.join(config.viewMount, config.staticRoot, '/javascripts/jsoncan-dashboard.js');
  }

  if ( ! config.stylesheets.base ) {
    config.stylesheets.base = path.join(config.viewMount, config.staticRoot, '/stylesheets/base.css');  
  }
  
  if ( ! config.mainToolbars ) {
    config.mainToolbars     = [ config.viewMount + '|i:th|' + config.title ];  
  }

  config.mainToolbars = BH.anchors.render(config.mainToolbars); 

  // prepare for logo
  if (yi.isNotEmpty(config.logo)) {
    config.logo = BH.anchors.render(config.logo);
  }

  if (yi.isNotEmpty(config.rightToolbars)) {
    config.rightToolbars = BH.anchors.render(config.rightToolbars);
  }

  if (yi.isNotEmpty(config.footbars)) {
    config.footbars = BH.anchors.render(config.footbars);
  }

  // console.log(config);

  return config;
}