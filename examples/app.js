var glory = require('glory')({
  path       : __dirname,
  tailbone   : {
    header: '<center>please access: <a href="/admin">dashboards</a></center>'
  },
  port: {
    dev: 4000
  }
});
var dashboards = require('./dashboards');
var mount      = '/admin';
var app        = dashboards.getApp(mount);

glory.app.use(mount, app);

glory.ready(function () {
  console.log('listen on %s', glory.app.get('port'));
});