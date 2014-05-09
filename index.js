
exports = module.exports = Dashboards;

var path       = require('path');
var Controller = require('./libs/controller');
var yi         = require('yi');
// var Helpers = require('./Helpers');
var BH         = require('bootstrap-helper');

function Dashboards (can, settings, tables) {
  this.can = can;
  this.initConfig(settings);
  this.initApp();
  this.initLocals();
  this.tables = tables || {};
  // if tables is not empty, add all related controller immediately
  this.addAll();
}

Dashboards.prototype.initConfig = function (settings) {
  var Config = require('./config');
  
  settings = yi.merge(settings, {
    mount           : '',
    viewMount       : '',  // important, for static source url
    staticRoot      : '/dashboards-assets'  // the route app serve the static files
  });

  if (! settings.viewMount && settings.mount ) { settings.viewMount = settings.mount; }

  this.config = yi.merge(settings, Config.create(settings.viewMount, settings.staticRoot));
};

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


  app.use(favicon(this.config.favicon));
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
  app.use(this.config.staticRoot, express.static(path.join(__dirname, 'public')));

  this.app = app;
};

Dashboards.prototype.initErrorHandler = function () {
  var tailbone = require('tailbone').create({
    viewMount: this.config.viewMount
  });

  tailbone.enable(this.app);
};


Dashboards.prototype.initLocals = function () {

  if ( ! this.app) { return; }

  yi.merge(this.app.locals, this.config);

  var currentDate = new Date();

  this.app.locals.currentDate  = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];

  // prepare for logo
  if (yi.isNotEmpty(this.config.logo)) {
    this.app.locals.logo = BH.anchors.render(this.config.logo);
  }

  // prepare for nav links, render toolbars
  if (yi.isNotEmpty(this.config.mainToolbars)) {
    this.app.locals.mainToolbars = BH.anchors.render(this.config.mainToolbars); 
  }

  if (yi.isNotEmpty(this.config.rightToolbars)) {
    this.app.locals.rightToolbars = BH.anchors.render(this.config.rightToolbars);
  }

  if (yi.isNotEmpty(this.config.footbars)) {
    this.app.locals.footbars = BH.anchors.render(this.config.footbars);
  }

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