
exports = module.exports = Dashboards;

var path       = require('path');
var Controller = require('./libs/controller');
var yi         = require('yi');
// var Helpers = require('./Helpers');
var BH         = require('bootstrap-helper');
var CONFIG     = require('./libs/config');

function Dashboards (can, settings, tables) {
  this.can      = can;
  this.settings = yi.merge(settings || {}, {
    title: '后台管理',
    mount: '',
    stylesheets: {},
    javascripts: {}
  });

  // set default main toolbars
  if (yi.isEmpty(this.settings.mainToolbars)) {
    this.settings.mainToolbars = [
      this.settings.mount + '/|i:th|' + this.settings.title
    ];
  }

  this.initApp();
  this.initLocals();

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
  
  if (this.app) return;

  var express        = require('express');
  var favicon        = require('serve-favicon');
  var logger         = require('morgan');
  var cookieParser   = require('cookie-parser');
  var bodyParser     = require('body-parser');
  var session        = require('cookie-session');
  var multipart      = require('connect-multiparty');
  // var debug       = require('debug')('app');
  var csrf           = require('csurf');
  
  var swig           = require('swig');
  // var swigExtras  = require('swig-extras');
  var app            = express();

  app.isProduction   = app.get('env') === 'production';

  // swigExtras.useFilter(swig, 'nl2br');

  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', path.join(__dirname, 'views'));

  if ( ! app.isProduction ) {
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
  }
  
  // view engine setup
  // app.set('views', path.join(__dirname, 'views'));
  // app.set('view engine', 'jade');


  app.use(favicon(this.settings.favicon || CONFIG.favicon));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  app.use(multipart({
    maxFilesSize: 20 * 1024 * 1024,
    uploadDir: path.join(__dirname, 'public/uploads')
  }));

  app.use(require('stylus').middleware({
     src:__dirname + '/public',
  	 compress: (app.isProduction ? true : false),
  	 force: (app.isProduction ?  false : true)
   }));

  app.use(cookieParser('dashboards admin'));
  app.use(session({keys: ['dashboards', 'admin'], maxAge: 60 * 60 * 1000}));
  app.use(csrf());
  app.use(express.static(path.join(__dirname, 'public')));

  this.app = app;
};

Dashboards.prototype.initErrorHandler = function () {
  /// error handlers
  // development error handler
  // will print stacktrace
  /// catch 404 and forwarding to error handler
  this.app.use(function(req, res, next) {
      var err = new Error('对不起，页面不存在');
      err.status = 404;
      next(err);
  });

  if (! this.app.isProduction ) {
    
    this.app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      // res.send('对不起，后台发生错误');
      res.render('error', {
          message: err.message,
          error: err
      });
    });

  }

  // production error handler
  // no stacktraces leaked to user
  this.app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message
      });
  });

};

Dashboards.prototype.initLocals = function () {

  if ( ! this.app) { return; }

  var currentDate = new Date();

  this.app.locals.mount        = this.settings.mount;
  this.app.locals.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  // prepare for logo
  if (yi.isNotEmpty(this.settings.logo)) {
    this.app.locals.logo = BH.anchors.render(this.settings.logo);
  }

  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(this.settings.mainToolbars)) {
    this.app.locals.mainToolbars = BH.anchors.render(this.settings.mainToolbars); 
  }

  if (yi.isNotEmpty(this.settings.rightToolbars)) {
    this.app.locals.rightToolbars = BH.anchors.render(this.settings.rightToolbars);
  }

  if (yi.isNotEmpty(this.settings.footbars)) {
    this.app.locals.footbars = BH.anchors.render(this.settings.footbars);
  }

  this.app.locals.stylesheets           = this.settings.stylesheets;
  this.app.locals.stylesheets.base      = this.settings.stylesheets.base || this.settings.mount + CONFIG.stylesheets.base;
  this.app.locals.stylesheets.bootstrap = this.settings.stylesheets.bootstrap || CONFIG.stylesheets.bootstrap;
  this.app.locals.stylesheets.fa        = this.settings.stylesheets.fa || CONFIG.stylesheets.fa;
  
  this.app.locals.javascripts           = this.settings.javascripts;
  this.app.locals.javascripts.base      = this.settings.javascripts.base || this.settings.mount + CONFIG.javascripts.base;
  
  this.app.locals.javascripts.jquery    = this.settings.javascripts.jquery || CONFIG.javascripts.jquery;

  this.app.locals.javascripts.bootstrap = this.settings.javascripts.bootstrap || CONFIG.javascripts.bootstrap;
  this.app.locals.javascripts.tinymce   = this.settings.javascripts.tinymce || CONFIG.javascripts.tinymce;

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

// this fn should invoke at last
Dashboards.prototype.addIndexPage = function () {
  Controller.indexPage(this);
  this.initErrorHandler();
};