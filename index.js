/**
 *
 *  var dashboard = new Dashboard(app, can);
 *  dashboard.bind('news', config);
 *  prefix: 'admin',
		title: '后台管理', 
		// routeRoot: ['/admin', '后台管理'],
		viewPath: __dirname + '/../views/dashboard/',
		models: {
			newsCategories: '新闻分类',
			news: '新闻',
			jobs: '职位',
			factories: '工厂一瞥',
			about: '公司介绍',
			banners: '主页横幅',
			licences: '企业资质'
		},
		viewMap: {
			add: 'edit.html'
		}
 */

exports = module.exports = Dashboards;

var path = require('path');
var utils = require('./libs/utils');
var Controller = require('./libs/controller'); 

function Dashboards (app, can, settings) {
	this.app = app;
	this.can = can;
	this.settings = utils.merge(settings, {
	  prefix: 'admin'
	});
	this.modules = {};
}

// build table admin routes
Dashboards.prototype.add = function (tableName, dashboardSettings, actionsConfig) {
  this.modules[tableName] = dashboardSettings;
	Controller.create(this, tableName, actionsConfig).enable();
};

Dashboards.prototype.addIndexPage = function () {
  Controller.indexPage(this);
};