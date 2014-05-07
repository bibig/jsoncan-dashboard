var config = {};
var path = require('path');

config.favicon = path.join(__dirname, '../public/images/favicon.ico');

// cdn settings
config.javascripts = {
  jquery    : '//ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.0.min.js',
  tinymce   : '//tinymce.cachefly.net/4.0/tinymce.min.js',
  bootstrap : '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js',
  base: '/javascripts/jsoncan-dashboard.js'  // local, need add mount
};

config.stylesheets = {
  base : '/stylesheets/admin.css', // local, need add mount
  bootstrap: '//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css',
  fa: '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css'
};


module.exports = config;