var mainApp    = require('express')();
var dashboards = require('./dashboards');
var mount      = '/admin';
var app        = dashboards.getApp(mount);

mainApp.use(mount, app);

mainApp.listen(4000);