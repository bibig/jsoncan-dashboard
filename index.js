
exports = module.exports = Dashboards;

var path       = require('path');
var Controller = require('./libs/controller');
var yi         = require('yi');
var Helpers      = require('./Helpers');

function Dashboards (can, settings, tables) {
  this.can      = can;
  this.settings = yi.merge(settings || {}, {
    title: '后台管理',
    mount: ''
  });

  // set default main toolbars
  if (yi.isEmpty(this.settings.mainToolbars)) {
    this.settings.mainToolbars = [
      this.settings.mount + '/|i:th|' + this.settings.title
    ];
  }

  this.initApp();
  this.tables = tables || {};
  // if tables is not empty, add all related controller immediately
  this.addAll();
}

/**
 * [initApp description]
 * initialize an express app for dashboards
 * @author bibig@me.com
 * @update [2014-05-03 15:45:37]
 * @return {express app}
 */
Dashboards.prototype.initApp = function () {
  var express       = require('express');
  var favicon       = require('static-favicon');
  var logger        = require('morgan');
  var cookieParser  = require('cookie-parser');
  var bodyParser    = require('body-parser');
  var session       = require('cookie-session');
  var multipart     = require('connect-multiparty');
  // var debug      = require('debug')('app');
  var csrf          = require('csurf');
  
  var swig          = require('swig');
  // var swigExtras = require('swig-extras');
  var app           = express();
  var isProduction  = app.get('env') === 'production';
  var currentDate   = new Date();

  if (this.app) return;

  // swigExtras.useFilter(swig, 'nl2br');

  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', path.join(__dirname, 'views'));

  if ( ! isProduction ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
  }

  // set layout needed variables
  app.locals.isProduction = isProduction;
  app.locals.mount        = this.settings.mount;
  app.locals.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];
  // app.locals.mountUrl        = this.settings.mount + '/';
  // app.locals.dashboardsTitle = this.settings.dashboardsTitle || this.settings.title;
  // app.locals.mainSiteName    = this.settings.mainSiteName || '网站';
  // app.locals.mainSiteUrl     = this.settings.mainSiteUrl || '/';
  
  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(this.settings.mainToolbars)) {
    app.locals.mainToolbars = Helpers.anchor.render(this.settings.mainToolbars); 
  }

  if (yi.isNotEmpty(this.settings.rightToolbars)) {
    app.locals.rightToolbars = Helpers.anchor.render(this.settings.rightToolbars);
  }

  if (yi.isNotEmpty(this.settings.footbars)) {
    app.locals.footbars = Helpers.anchor.render(this.settings.footbars);
  }

  // prepare for logo
  if (yi.isNotEmpty(this.settings.logo)) {
    app.locals.logo = Helpers.anchor.render(this.settings.logo);
  }

  // view engine setup
  // app.set('views', path.join(__dirname, 'views'));
  // app.set('view engine', 'jade');


  app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')));
  // app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  app.use(multipart({
    maxFilesSize: 20 * 1024 * 1024,
    uploadDir: path.join(__dirname, 'public/uploads')
  }));

  app.use(require('stylus').middleware({
     src:__dirname + '/public',
  	 compress: (isProduction ? true : false),
  	 force: (isProduction ?  false : true)
   }));

  app.use(cookieParser('dashboards admin'));
  app.use(session({keys: ['dashboards', 'admin'], maxAge: 60 * 60 * 1000}));
  app.use(csrf());
  app.use(express.static(path.join(__dirname, 'public')));

  this.app = app;
};

/**
 * [addAll]
 * add all controllers
 * @author bibig@me.com
 * @update [date]
 */
Dashboards.prototype.addAll =  function () {
  var self  = this;
  var names = Object.keys(this.tables);

  if (names.length === 0) { return; }

  names.forEach(function (name) {
    // console.log('ready to add %s', name);
    Controller.create(self, name).enable();
  });
};

Dashboards.prototype.add = function (tableName, config) {
  this.tables[tableName] = config;
  Controller.create(this, tableName).enable();

};

Dashboards.prototype.addIndexPage = function () {
  Controller.indexPage(this);
};