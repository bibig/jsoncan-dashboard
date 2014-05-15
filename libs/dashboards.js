
exports = module.exports = Dashboards;

var path       = require('path');
var Controller = require('./controller');
var yi         = require('yi');
var Config     = require('../config');
var Glory      = require('glory');

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
  
  if (this.glory) return;

  this.glory = Glory(this.config);
  yi.merge(this.glory.app.locals, this.config);
  this.app = this.glory.app;
};

Dashboards.prototype.initErrorHandler = function () {
  this.glory.tail({
    viewMount: this.config.viewMount
  });
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