module.exports = exports = create;

var helpers = require('../helpers');
var utils = require('./utils');
var path = require('path');
var Htmler = require('htmler');
var Schemas = require('./schemas');
var Upload = require('./upload');
var async = require('async');

function create(Table, config) {
	this.Table = Table;
	this.config = config;
	this.schemas = new Schemas(Table.getFields());
	
	this.tableAdminRoot = tableAdminRoot;
	this.listRoute = listRoute;
	this.addRoute = addRoute;
	this.viewRoute = viewRoute;
	this.deleteRoute = deleteRoute;
	this.editRoute = editRoute;
	
	this.initActionConfig = initActionConfig;
	this.tableAdminTitle = tableAdminTitle;
	this.viewTitle = viewTitle;
	this.viewFile = viewFile;
	this.breadcrumbs = breadcrumbs;
	this.render = render;
	
	this.listAction = listAction;
	this.viewAction = viewAction;
	this.addAction = addAction;
	this.deleteAction = deleteAction;
	this.editAction = editAction;
	this.saveAction = saveAction;
	this.uploadAction = uploadAction;
}


function render (res, name, locals) {
	if (!locals.pageTitle) {
		locals.pageTitle = this.viewTitle(name);
	}
	res.render(this.viewFile(name), locals);
}


function initActionConfig (name, defaults) {
	
	if (this.config[name] === false) {
		return false;
	}
	
	if (!this.config[name]) {
		this.config[name] = {};
	}
	
	defaults = defaults || {
		schemas: this.schemas,
		showFields: this.schemas.inputFields(),
		locals: {}
	};
	
	switch (name) {
		case 'view':
			defaults.isFormat = true;
			break;
		case 'edit':
			break;
		case 'add':
			break;
		case 'list':
			defaults.showPage = true;
			defaults.pageSize = 50;
			defaults.filters = {};
			defaults.isFormat = true;
			break;
		case 'delete':
			break;
	}
	
	utils.merge(this.config[name], defaults);
	
	// return utils.clone(this.config[name]);
	return this.config[name];
}


function viewFile (name) {
	if (this.config[name].view) {
		return this.config[name].view;	
	} else {
		return path.join(this.config.all.viewPath, this.config[name].viewName || name);
	}
}

function viewTitle (name) {
	var pageTitle = this.config[name].locals.pageTitle;
	var modelTitle;
	if (!pageTitle) {
		modelTitle = this.config.all.models[this.config.name];
		switch (name) {
			case 'view':
				pageTitle = '浏览' + modelTitle;
				break;
			case 'add':
				pageTitle = '新增' + modelTitle;
				break;
			case 'edit':
				pageTitle = '编辑' + modelTitle;
				break;
			case 'list':
				pageTitle = modelTitle + '清单';
		}
	}
	
	return pageTitle;
}

function tableAdminRoot () {
	return this.config.all.routeRoot[0] + '/' + this.Table.table;
}

function listRoute (page) {
	page = page || 1;
	return path.join(this.tableAdminRoot(), 'page/' + page);
}

function addRoute () {
	return path.join(this.tableAdminRoot(), 'add');
}

function viewRoute (_id) {
	return path.join(this.tableAdminRoot(), 'view/' + _id);
}

function editRoute (_id) {
	return path.join(this.tableAdminRoot(), 'edit/' + _id);
}

function deleteRoute (_id) {
	return path.join(this.tableAdminRoot(), 'delete/' + _id);
}

function breadcrumbs (layers) {
	var ol = Htmler.ol;
	var li = Htmler.li;
	var a = Htmler.a;
	var list = [
		li().html(a({href: this.config.all.routeRoot[0]}).html(this.config.all.routeRoot[1]))
	];
	
	layers.forEach(function (layer) {
		if (Array.isArray(layer)) {
			list.push(li().html(a({href: layer[0]}).html(layer[1])));
		} else {
			list.push(li('active').html(layer));
		}
	});
	
	return ol('breadcrumb').html(list);
}

function listAction () {
	var config = this.initActionConfig('list');
	var self = this;
	
	if (config === false ) { return false; }
	
	return function (req, res, next) {
		
		var currentPage = parseInt( req.params.page || 1 , 10);
		var locals = utils.clone(config.locals);
		var tasks = {};
		var selectFields = self.schemas.getRealNames(config.showFields);
		
		var referenceNames = self.schemas.getReferenceNames(config.showFields);
		
		if (selectFields.indexOf('_id') == -1) {
			selectFields.unshift('_id');
		}
		
		tasks.list = function (callback) {
			var skip = (currentPage - 1) * config.pageSize;
			var query = self.Table.query(config.filters)
								.select(selectFields)
								.skip(skip)
								.limit(config.pageSize);
		
			referenceNames.forEach(function (name) {
				query.ref(name);
			});
			
			if (Array.isArray(config.order)) {
				query.order(config.order[0], config.order[1] || false)
			}
			
			if (config.isFormat) {
				query.format();
			}
			
			query.exec(function (e, records) {
				if (e) { callback(e); } else {
					// console.log(records);
					config.links = {
						// add: function () { return getAddRoute(Table.table)},
						view: function (_id) { return self.viewRoute(_id);},
						edit: function (_id) { return self.editRoute(_id); },
						delete: function (_id) { return self.deleteRoute(_id); }
					};
					callback(null, helpers.list.render(records, config));
				}
			});
		};
		
		if (config.showPage) {
			tasks.pages = function (callback) {
				self.Table.query(config.filters).count(function (e, count) {
					var pageCount;
					if (e) { callback(e);} else {
						pageCount = Math.ceil(count / config.pageSize);
						callback(null, helpers.list.renderPages(
							currentPage,
							pageCount,
							function (page) { return self.listRoute(page)}
						));
					}
				});
			};
		}

		async.series(tasks, function (e, results) {
			if (e) { next(e);} else {
				locals.list = results.list;
				locals.pages = results.pages || '';
				locals.addLink = self.addRoute();
				locals.breadcrumbs = self.breadcrumbs([self.viewTitle('list')]);
				self.render(res, 'list', locals);
			}
		});
		
	}; // end return;
} // end of function

function viewAction () {
	var self = this;
	var config = this.initActionConfig('view');
	
	if (config === false ) { return false;}
	
	return function (req, res, next) {
		var _id = req.params.id;
		var query = config.isFormat ? self.Table.read : self.Table.find;
		var locals = utils.clone(config.locals);
		var finder = self.Table.finder(_id);
		var referenceNames = self.schemas.getReferenceNames(config.showFields);
		
		if (config.isFormat) {
			finder.format();
		}
		
		referenceNames.forEach(function (name) {
			finder.ref(name);
		});
		
		finder.exec(function (e, record) {
			if (e) {
				next(e);
			} else {
				console.log(record);
				config.links = {
						add: self.addRoute(),
						edit: self.editRoute(_id),
						delete: self.deleteRoute(_id)
				};
				
				locals.table = helpers.view.render(record, config);
				locals.breadcrumbs = self.breadcrumbs([
					[self.tableAdminRoot(), self.tableAdminTitle()], 
					self.viewTitle('view')
				]);
				self.render(res, 'view', locals);
			}
		}); // end of finder
	}; // end of return
}

function getPostData (req) {
	return req.body[this.Table.table];
}

function uploadAction () {
	var self = this;
	var upload;
	
	return function (req, res, next) {
		var _id = req.params.id;
		
		if (req.method == 'GET') { return next(); }
		
		if (req.files) {
			upload = new Upload.create(req.files, self.schemas);
			
			if (upload.validate()) {
				upload.save(function (e) {
					if (e) {
						next(e);
					} else {
						utils.merge(getPostData.call(self, req), upload.data);
						if (_id) {// edit mode, should delete old file
							self.Table.find(_id, function (e, record) {
								if (e) {
									next(e);
								} else {
									self.schemas.deleteFiles(record, upload.data, function (e) {
										if (e) {
											next(e);
										} else {
											next();
										}
									});
								}
							});
							return;			
						} else {
							next();
						} // end of if (_id)
					}
				});
			} else { // failed validate
				req.errors = req.errors || {};
				utils.merge(req.errors, upload.errors);
				// console.log(req.errors);
				next();
			} // end of if (upload.validate())
		} else { // end of if(req.files)
			next();
		}
		
	}
}

function setReferencesValues (showFields, callback) {
	var refs = this.schemas.getReferences(showFields);
	var tasks = Object.keys(refs);
	var allValues = {};
	var self = this;
	var setFn = function (name, callback) {
		var info = refs[name];
		var query = self.Table.findAllBelongsTo(info, function (e, map) {
			if (e) { callback(e); } else {
				self.schemas.addValues(name, map);
				callback();
			}
		});
	};
	
	if (tasks.length > 0) {
		async.each(tasks, setFn, callback);
	} else {
		callback();
	}
}

function addAction () {
	var self = this;
	var config = this.initActionConfig('add');
	
	if (config === false ) { return false;}
	
	return function (req, res, next) {
		config.data = getPostData.call(self, req) || {};
		config.errors = req.errors || {};
		config.action = self.addRoute();
		
		function renderForm () {
			var locals = utils.clone(config.locals);
			locals.form = helpers.form.render(self.Table.table, config);
			locals.breadcrumbs = self.breadcrumbs([
					[self.tableAdminRoot(), self.tableAdminTitle()],
					self.viewTitle('add')]
			);
			self.render(res, 'add', locals);
		}
		
		setReferencesValues.call(self, config.showFields, function (e) {
			if (e) { next(e);} else {
				renderForm();
			}
		});
	};
}

function saveAction () {
	var self = this;
	
	return function (req, res, next) {
		var _id = req.params.id;
		var data = getPostData.call(self, req);
		var model;
		req.errors = req.errors || {};
		if (req.method == 'GET') { return next(); }
		
		if (data) {
			if (_id) { data._id = _id; }
			data = self.schemas.convert(data, req.body._fields.split(','));
			model = self.Table.create(data);
			if (Object.keys(req.errors).length == 0 && model.validate()) {
				model.save(function (e, record) {
					if (e) { next(e); } else {
						res.redirect(self.viewRoute(record._id));
					}
				});
			} else {
				utils.merge(req.errors, model.errors);
				next();
			}	
		} // end of if (data)
		
	}; // end of return

}

function editAction (Table, config, settings) {
	var self = this;
	var config = this.initActionConfig('edit');
	
	if (config === false ) { return false;}
	
	return function (req, res, next) {
		var _id = req.params.id;
		var locals = utils.clone(config.locals);
		
		function renderForm () {
			config.errors = req.errors || {};
			config.action = self.editRoute(_id);
			locals.form = helpers.form.render(self.Table.table, config);
				locals.breadcrumbs = self.breadcrumbs([
					[self.tableAdminRoot(), self.tableAdminTitle()],
					self.viewTitle('edit')]
			);
			self.render(res, 'edit', locals);
		}
		
		
		if (req.method == 'GET') {
			self.Table.find(_id).exec(function (e, record) {
				if (e) {
					next(e);
				} else {
					setReferencesValues.call(self, config.showFields, function (e) {
						if (e) { next(e);} else {
							config.data = record;
							renderForm();
						}
					});
				}
			});
		} else {
			setReferencesValues.call(self, config.showFields, function (e) {
				if (e) { next(e);} else {
					config.data = getPostData.call(self, req);
					renderForm();
				}
			});
		}
	}; // end of return
	
}

function tableAdminTitle () {
	var title = this.config.all.title;
	if (!title) {
		title = this.config.all.models[this.config.name] + '管理'
	}
	return title;
}

function deleteAction () {
	var self = this;
	// var config = this.initActionConfig('delete');
	
	return function (req, res, next) {
		var _id = req.params.id;
		self.Table.remove(_id, function (e, record) {
			if (e) {
				next(e);
			} else {
				self.schemas.deleteFiles(record, null, function (e) {
					if (e) {
						next(e);
					} else {
						res.redirect(self.tableAdminRoot());	
					}
				});
			}
		});
	}
} // end of function