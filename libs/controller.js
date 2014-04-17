exports.create = create;
exports.indexPage = indexPage;

var helpers = require('../helpers');
var utils = require('./utils');
var Routes = require('./routes');
var Views = require('./views');
var Schemas = require('./schemas');
var Upload = require('./upload');
var async = require('async');
var path = require('path');

function indexPage (dashboards) {
  var routesMap = {};
  var tables = Object.keys(dashboards.modules);
  var prefix = dashboards.settings.prefix;
  var indexAction;
  
  if (tables.length === 0) { return; }
  
  tables.forEach(function (name) {
    routesMap[name] = Routes.create(prefix, name);
  });
  
  indexAction = function (req, res, next) {
    var view = path.join(dashboards.settings.viewPath, 'index.html');
    var locals = {};
    
    locals.list = helpers.grids.renderDashboards(dashboards.modules, routesMap);
    res.render(view, locals);
  };
  
  
  dashboards.app.get(Routes.indexRoute(prefix), indexAction);
  // console.log(dashboards.modules);
}

function create (dashboards, name, actions) {
  return new Controller(dashboards, name, actions);
}

function Controller (dashboards, name, actions) {
  this.dashboards = dashboards;
	this.Table = dashboards.can.open(name);
	this.settings = dashboards.modules[name];
	this.prefix = this.dashboards.settings.prefix;
	this.actions = actions;
	
	this.schemas = new Schemas(this.Table.getFields());
	this.routes = Routes.create(this.prefix, name);
	this.views = new Views(this);
		
	this.hasListAction = true;
	this.hasViewAction = true;
	this.hasAddAction = true;
	this.hasEditAction = true;
	this.hasDeleteAction = true;
	
	if (this.settings.max) {
	  this.setRecordCount();
	}
}

Controller.prototype.enable = function () {
  var defaultAction = this.settings.defaultAction || 'list'; 
  var middlewares;
  var list = this.listAction();
	var add = this.addAction();
	var edit = this.editAction();
	var view = this.viewAction();
	var del = this.deleteAction();
	
	if ( ! list ) { this.hasListAction = false; }
	if ( ! add ) { this.hasAddAction = false; }
	if ( ! view ) { this.hasViewAction = false; }
	if ( ! edit ) { this.hasEditAction = false; }
	if ( ! del ) { this.hasDeleteAction = false; }
	
	
	switch (defaultAction) {
	  case 'list':
	    if (this.hasListAction) { this.dashboards.app.get(this.routes.rootRoute(), list); }
	    break;
	  case 'view':
	    if (this.hasViewAction) {
	      this.dashboards.app.get(this.routes.rootRoute(), view);
	    }
	    break;
	}
	
	if (this.hasListAction) {
	  // console.log(this.routes.listRoute(':page'));
		this.dashboards.app.get(this.routes.listRoute(':page'), list);
	}
	
	if (this.hasAddAction) {
		middlewares = [];
		
		if (this.settings.max) { 
		  middlewares.push(this.checkMaxAction()); 
		}
		
		if (this.schemas.hasUploadField()) {
			middlewares.push(this.uploadAction());
		}
				
		middlewares.push(this.saveAction());
		this.dashboards.app.all(this.routes.addRoute(), middlewares, add);
	}
	
	if (this.hasEditAction) {
		middlewares = [];
		
		if (this.schemas.hasUploadField()) {
			middlewares.push(this.uploadAction());
		}		
		middlewares.push(this.saveAction());
		
		this.dashboards.app.all(this.routes.editRoute(':id'), middlewares, edit);
	}
	
	if (this.hasViewAction) {
		this.dashboards.app.get(this.routes.viewRoute(':id'), view);
	}
	
	if (this.hasDeleteAction) {
		this.dashboards.app.get(this.routes.deleteRoute(':id'), del);
	}
};

Controller.prototype.setRecordCount = function () {
  this.recordCount =  this.Table.countSync();
};

Controller.prototype.incrementRecordCount = function () {
  if (this.settings.max) {
    this.recordCount++;
  }
};

Controller.prototype.decrementRecordCount = function () {
  if (this.settings.max) {
    this.recordCount--;
  }
};

Controller.prototype.isAvailableForAdd = function () {
  if (this.settings.max) {
    // return this.config.all.max > this.Table.countSync();
    return this.settings.max > this.recordCount;
  }
  return true;
};

Controller.prototype.initActionConfig = function (name, defaults) {
	if (this.actions[name] === false) {
		return false;
	}
	
	if (!this.actions[name]) {
		this.actions[name] = {};
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
	
	utils.merge(this.actions[name], defaults);
	
	// return utils.clone(this.config[name]);
	return this.actions[name];
};

Controller.prototype.listAction = function () {
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
					config.links = {
						view: self.hasAddAction ? function (_id) { return self.routes.viewRoute(_id);} : false,
						edit: self.hasEditAction ? function (_id) { return self.routes.editRoute(_id); } : false,
						delete: self.hasDeleteAction ? function (_id) { return self.routes.deleteRoute(_id); } : false
					};
					callback(null, helpers.list.renderTable(records, config));
				}
			});
		};
		
		if (config.showPage) {
			tasks.pages = function (callback) {
				self.Table.query(config.filters).count(function (e, count) {
					var pageCount;
					if (e) { callback(e);} else {
						pageCount = Math.ceil(count / config.pageSize);
						callback(null, helpers.pages.render(
							currentPage,
							pageCount,
							function (page) { return self.routes.listRoute(page)}
						));
					}
				});
			};
		}

		async.series(tasks, function (e, results) {
		  var addLink;
			if (e) { next(e);} else {
			  addLink = self.hasAddAction && self.isAvailableForAdd() ? self.routes.addRoute() : '';
				locals.list = results.list;
				locals.pages = results.pages || '';
				locals.title = helpers.list.renderTitle(self.views.viewTitle('list'), addLink);
				self.views.render(res, 'list', locals);
			}
		});
		
	}; // end return;
}; // end of function

Controller.prototype.viewAction = function () {
	var self = this;
	var config = this.initActionConfig('view');

	if (config === false ) { return false; }
	
	return function (req, res, next) {
		var _id = req.params.id || null;
		var locals = utils.clone(config.locals);
		var query;
		var referenceNames = self.schemas.getReferenceNames(config.showFields);
		
		function _render (record) {
		  var hasManyRoutes;
		  
		  config.links = {
          add: self.hasAddAction && self.isAvailableForAdd() ? self.routes.addRoute() : false,
          edit: self.hasEditAction ? self.routes.editRoute(_id) : false,
          delete: self.hasDeleteAction ? self.routes.deleteRoute(_id) : false
      };
      
      if (config.hasMany) {
        hasManyRoutes = Routes.create(self.prefix, config.hasMany.table);
        config.hasMany.links = {
          view: function (_id) { return hasManyRoutes.viewRoute(_id);}
        };
        config.hasMany.readonly = true;
        config.hasMany.schemas = new Schemas(self.dashboards.can.open(config.hasMany.table).getFields());
        // locals.hasManyList = helpers.list.renderTable(record[config.hasMany.table], config.hasMany); 
      }
      locals.table = helpers.view.render(record, config);
      self.views.render(res, 'view', locals);
		}
		
		if (!_id) {
		  query = self.Table.query().limit(1); // for only one record table
		} else {
		  query = self.Table.finder(_id);
		}
		
		if (config.isFormat) {
			query.format();
		}
		
		referenceNames.forEach(function (name) {
			query.ref(name);
		});
		
		if (config.hasMany) {
		  query.hasMany(config.hasMany.table);
		}
		
		query.exec(function (e, record) {
			if (e) {
				next(e);
			} else {
				if (Array.isArray(record)) {
				  record = record[0] || {};
				  _id = record._id;
				}
				_render(record);
			}
		}); // end of finder
	}; // end of return
};

Controller.prototype.getPostData = function (req) {
	return req.body[this.Table.table];
};

Controller.prototype.uploadAction = function () {
	var self = this;
	var upload;
	
	return function (req, res, next) {
		var _id = req.params.id, isEdit;
		
		if (req.method == 'GET') { return next(); }
		
		if (req.files) {
			upload = new Upload.create(req.files, self.schemas);
			
			// 针对此类情况：只想修改非上传文件的字段。比如，只想修改标题，而保持原来的图片。
			if (upload.noFileUpload() && self.routes.isEditAction(req)) {
			  self.Table.find(_id).exec(function (e, record) {
          if (e) {
            next(e);
          } else {
            // console.log(self.schemas.getFileRelatedData(record));
            utils.merge(self.getPostData(req), self.schemas.getFileRelatedData(record));
            next();
          }
        });
			  return;
			}
			
			if (upload.validate()) {
				upload.save(function (e) {
					if (e) {
						next(e);
					} else {
						utils.merge(self.getPostData(req), upload.data);
						if (_id) {// edit mode, should delete old file
							self.Table.find(_id).exec(function (e, record) {
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
				next();
			} // end of if (upload.validate())
		} else { // end of if(req.files)
			next();
		}
		
	}
};

Controller.prototype.setReferencesValues = function (showFields, callback) {
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
};

Controller.prototype.addAction = function () {
	var self = this;
	var config = this.initActionConfig('add');

	if (config === false ) { return false; }
	
	return function (req, res, next) {
		config.data = self.getPostData(req) || {};
		config.errors = req.errors || {};
		config.action = self.routes.addRoute();
		
		function renderForm () {
			var locals = utils.clone(config.locals);
			locals.form = helpers.form.render(self.Table.table, config);
			self.views.render(res, 'add', locals);
		}
		
		self.setReferencesValues(config.showFields, function (e) {
			if (e) { next(e);} else {
				renderForm();
			}
		});
	};
};

Controller.prototype.checkMaxAction = function () {
  var self = this;
  
  return function (req, res, next) {
    if (!self.isAvailableForAdd()) {
		  return res.redirect(self.routes.rootRoute());
		}
		next();
  }
};

Controller.prototype.saveAction = function () {
	var self = this;
	
	return function (req, res, next) {
	  var isNew = true;
		var _id = req.params.id;
		var data = self.getPostData(req);
		var model;
		req.errors = req.errors || {};
		if (req.method == 'GET') { return next(); }
		
		if (data) {
			if (_id) { 
			  data._id = _id; 
			  isNew = false;
			}
			
			data = self.schemas.convert(data, req.body._fields.split(','));
			model = self.Table.create(data);
			if (Object.keys(req.errors).length == 0 && model.validate()) {
				model.save(function (e, record) {
					if (e) { next(e); } else {
					  if (isNew) {
					    self.incrementRecordCount();
					  }
					  if (self.hasViewAction) {
					    res.redirect(self.routes.viewRoute(record._id));
					  } else {
					    res.redirect(self.routes.rootRoute());
					  }
					}
				});
			} else {
				utils.merge(req.errors, model.errors);
				next();
			}	
		} // end of if (data)
	}; // end of return

};

Controller.prototype.editAction = function (Table, config) {
	var self = this;
	var config = this.initActionConfig('edit');
	
	if (config === false ) { return false; }
	
	return function (req, res, next) {
		var _id = req.params.id;
		var locals = utils.clone(config.locals);
		
		function renderForm () {
			config.errors = req.errors || {};
			config.action = self.routes.editRoute(_id);
			locals.form = helpers.form.render(self.Table.table, config);
			self.views.render(res, 'edit', locals);
		}
		
		
		if (req.method == 'GET') {
			self.Table.find(_id).exec(function (e, record) {
				if (e) {
					next(e);
				} else {
					self.setReferencesValues(config.showFields, function (e) {
						if (e) { next(e);} else {
							config.data = record;
							renderForm();
						}
					});
				}
			});
		} else {
			self.setReferencesValues(config.showFields, function (e) {
				if (e) { next(e);} else {
					config.data = self.getPostData(req);
					renderForm();
				}
			});
		}
	}; // end of return
	
};

Controller.prototype.deleteAction = function () {
	var self = this;
	var config = this.initActionConfig('delete');
	
	if (config === false ) { return false; }
	
	return function (req, res, next) {
		var _id = req.params.id;
		self.Table.remove(_id, function (e, record) {
			if (e) {
				next(e);
			} else {
			  self.decrementRecordCount();
				self.schemas.deleteFiles(record, null, function (e) {
					if (e) {
						next(e);
					} else {
						res.redirect(self.routes.rootRoute());	
					}
				});
			}
		});
	}
}; // end of function