/**
 *
 *  var dashboard = new Dashboard(app, can);
 *  dashboard.bind('news', config);
 *
 */

exports = module.exports = create;

var path = require('path');
var utils = require('./libs/utils');
var Router = require('./libs/router'); 

function create (app, can, settings) {
	this.app = app;
	this.can = can;
	this.build = build;
	this.settings = settings;
}

// build table admin routes
function build (tableName, config) {
	var Table = this.can.open(tableName);
	var router;
	var list, add, edit, view, del;
	var middlewares;
	
	config.name = tableName;
	
	if ( ! config.all ) {
		config.all = {};
	}
	
	utils.merge(config.all,  utils.clone(this.settings))
	router = new Router(Table, config);
	
	list = router.listAction();
	add = router.addAction();
	edit = router.editAction();
	view = router.viewAction();
	del = router.deleteAction();
	
	if (list) { 
		this.app.get(router.tableAdminRoot(), list);
		this.app.get(router.listRoute(':page'), list);
	}
	
	if (add || edit) {
		middlewares = [];
		
		if (router.schemas.hasUploadField()) {
			middlewares.push(router.uploadAction());
		}		
		middlewares.push(router.saveAction());
		
		if (add) { this.app.all(router.addRoute(), middlewares, add); }
		if (edit) { this.app.all(router.editRoute(':id'), middlewares, edit); }
	}
	
	if (view) {
		this.app.get(router.viewRoute(':id'), view);
	}
	
	if (del) {
		this.app.get(router.deleteRoute(':id'), del);
	}
}