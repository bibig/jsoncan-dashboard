
exports = module.exports = Dashboards;

var path       = require('path');
var Controller = require('./controller');
var yi         = require('yi');
var Config     = require('../config');

function Dashboards (can, settings, tables) {
  this.can = can;
  this.config = Config.create(settings);
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
  
  if (this.app) return;

  var express       = require('express');
  var favicon       = require('serve-favicon');
  var logger        = require('morgan');
  var cookieParser  = require('cookie-parser');
  var bodyParser    = require('body-parser');
  var session       = require('cookie-session');
  var multipart     = require('connect-multiparty');
  // var debug      = require('debug')('app');
  var shine         = require('shine');
  var csrf          = require('csurf');
  
  var swig          = require('swig');
  // var swigExtras = require('swig-extras');
  var app           = express();

  app.isProduction   = app.get('env') === 'production';

  // swigExtras.useFilter(swig, 'nl2br');

  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', path.join(__dirname, '../views'));

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
    uploadDir: path.join(__dirname, '../public/uploads')
  }));

  /*
   app.use(require('stylus').middleware({
     src:__dirname + '/public',
     compress: (app.isProduction ? true : false),
     force: (app.isProduction ?  false : true)
   }));
  */
  app.use(cookieParser(this.config.cookieSecret));
  app.use(session(this.config.session));
  app.use(shine());
  app.use(csrf());
  app.use(this.config.staticRoot, express.static(path.join(__dirname, '../public')));

  yi.merge(app.locals, this.config);

  this.app = app;
};

Dashboards.prototype.initErrorHandler = function () {
  var tailbone = require('tailbone').create({
    viewMount: this.config.viewMount
  });

  tailbone.enable(this.app);
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