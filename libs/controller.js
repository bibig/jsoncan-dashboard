exports.create = create;
exports.indexPage = indexPage;

var helpers = require('../helpers');
var utils = require('./utils');
var Routes = require('./routes');
var Views = require('./views');
var Schemas = require('./schemas');
var Present = require('./present');
var Upload = require('./upload');
var async = require('async');
var path = require('path');
var debug = require('debug')('dashboard');

function indexPage (dashboards) {
  var routesMap = {};
  var tables = Object.keys(dashboards.modules);
  var mount = dashboards.settings.mount;
  var indexAction;
  
  if (tables.length === 0) { return; }
  
  tables.forEach(function (name) {
    routesMap[name] = Routes.create(mount, name);
  });
  
  indexAction = function (req, res, next) {
    var view = path.join(dashboards.settings.viewPath, 'index.html');
    var locals = {};
    
    locals.list = helpers.grids.renderDashboards(dashboards.modules, routesMap);
    res.render(view, locals);
  };
  
  dashboards.app.get(mount, indexAction);
}

function create (dashboards, name, actions) {
  return new Controller(dashboards, name, actions);
}

function Controller (dashboards, name, actions) {
  this.dashboards = dashboards;
  this.tableName = name;
	this.Table = dashboards.can.open(name);
	this.settings = dashboards.modules[name];
	this.mount = this.dashboards.settings.mount;
	this.actions = actions;
	
	this.schemas = Schemas.create(this.Table.getFields());
	this.routes = Routes.create(this.mount, name);
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
		this.dashboards.app.delete(this.routes.deleteRoute(':id'), del);
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
	  routes: this.routes,
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
	  // console.log(req.query);
		var currentPage = parseInt( req.params.page || 1 , 10);
		var locals = utils.clone(config.locals);
		var tasks = {};
		var filters = self.schemas.safeFilters(req.query || {});
		filter = utils.merge(filters, config.filters);
		
		if (config.query) {
		  tasks.query = function (callback) {
		    var info = config.query.name.split('.');
		    var table, textField, fields, query, schemaDefinedValues;
		    var fieldName = info[1] ? self.schemas.getReferenceField(info[0]) : info[0];
		    var queryConfig = {
		      title: config.query.title,
		      currentValue: req.query[fieldName],
		      qname: config.query.ref || fieldName,
		      routes: self.routes
		    };
		    var schemaValuesToRecords = function (values, name) { // prepare records for render filterDropdown
          var records = [];
          
          if (Array.isArray(values)) {
            for (var i = 0; i < values.length; i++) {
              var item = { _id: i };
              item[name] = values[i];
              records.push(item);
            }
          } else {
            Object.keys(values).forEach(function (key) {
              var item = { _id: key };
              item[name] = values[key];
              records.push(item);
            });
          }
  
          return records;
        }; // end of schemaValuesToRecords
		    
		    
		    if (info.length == 1) { // map or array field
		      schemaDefinedValues = self.schemas.getField(info[0], 'values');
		      queryConfig['textField'] = info[0];
		      callback(null, helpers.list.renderFilterDropdown(schemaValuesToRecords(schemaDefinedValues, info[0]), queryConfig));
		      return;
		    }
		    
		    table = info[0];
		    textField = info[1];
		    fields = ['_id', textField];
		    query = self.dashboards.can.open(table).query(config.query.filter || {}).select(fields).limit(config.query.limit || 50);
		    
		    if (config.query.order) {
		      query.order(config.query.order[0], config.query.order[1] || false);
		    }
		    
		    query.exec(function (e, records) {
		      // var queryConfig;
		      if (e) { callback(e); } else if (records.length == 0) { 
		        callback(null, '');
		      } else  {
		        queryConfig['textField'] = textField;
            callback(null, helpers.list.renderFilterDropdown(records, queryConfig));
          }
		    });
		    
		  };
		}
		
		tasks.list = function (callback) {
		  var selectFields = Present.getFieldNames(config.showFields);
      var referenceNames = self.schemas.getReferenceNames(selectFields);
      if (selectFields.indexOf('_id') == -1) {
        selectFields.unshift('_id');
      }
			var skip = (currentPage - 1) * config.pageSize;
			var	query = self.Table.query(filters)
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
					config.hasEditAction = !config.readonly ? self.hasEditAction : false;
					config.hasDeleteAction = !config.readonly ? self.hasDeleteAction : false;
					config.token = self.csrfToken(req);
					callback(null, helpers.list.renderTable(records, config));
				}
			});
		};
		
		if (config.showPage) {
			tasks.pages = function (callback) {
				self.Table.query(filters).count(function (e, count) {
					var pageCount;
					if (e) { callback(e);} else {
						pageCount = Math.ceil(count / config.pageSize);
						callback(null, helpers.pages.render(
							currentPage,
							pageCount,
							function (page) { return self.routes.listRoute(page, req.query)}
						));
					}
				});
			};
		}

		async.series(tasks, function (e, results) {
		  var addLinkUrl, addLink;
			if (e) { next(e);} else {
			  addLinkUrl = (self.hasAddAction && self.isAvailableForAdd()) ? self.routes.addRoute(req.query) : false;
			  addLink = helpers.list.renderAddLink(addLinkUrl);
				locals.list = results.list;
				locals.pages = results.pages || '';
				locals.title = helpers.list.renderTitle(self.views.viewTitle('list'), addLink, results.query);
				// locals.token = self.csrfToken(req);
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
		var selectFields = Present.getFieldNames(config.showFields);
		var referenceNames = self.schemas.getReferenceNames(selectFields);
		
		function _render (record) {
		  var hasManyRoutes;
		  config.hasAddAction = self.hasAddAction ? self.isAvailableForAdd() : false;
		  config.hasEditAction = !config.readonly ? self.hasEditAction : false;
			config.hasDeleteAction = !config.readonly ? self.hasDeleteAction : false;
      
      if (config.hasMany) {
        config.hasMany.routes = Routes.create(self.mount, config.hasMany.table);
        config.hasMany.readonly = true;
        config.hasMany.schemas = Schemas.create(self.dashboards.can.open(config.hasMany.table).getFields());
      }
      
      config.token = self.csrfToken(req);
      locals.table = helpers.view.render(record, config);
      self.views.render(res, 'view', locals);
		} // end of function
		
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
		config.data = {};
		utils.merge(config.data, self.getPostData(req));
		utils.merge(config.data, req.query);
		config.errors = req.errors || {};
		config.action = self.routes.addRoute();
		
		function renderForm () {
			var locals = utils.clone(config.locals);
			config.token = self.csrfToken(req);
			locals.form = helpers.form.render(self.Table.table, config);
			locals.errors = config.errors;
			self.views.render(res, 'add', locals);
		}
		
		self.setReferencesValues(config.showFields, function (e) {
			if (e) { next(e);} else {
				renderForm();
			}
		});
	};
};

// 并非强制，express app如果有设置csrf, 则运用。
Controller.prototype.csrfToken = function (req) {
  if (req.csrfToken) {
    return req.csrfToken();
  }
  return null;
};

// 如果超出了最大记录数，则不允许再增加记录，直接返回至默认路径
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
		
		if (!_id) {
		  return next(new Error('invalid param found'));
		}
		
		function renderForm () {
			config.errors = req.errors || {};
			config.action = self.routes.editRoute(_id);
			config.token = self.csrfToken(req);
			locals.form = helpers.form.render(self.Table.table, config);
			self.views.render(res, 'edit', locals);
		}
		
		if (req.method == 'GET') {
			self.Table.find(_id).exec(function (e, record) {
				if (e) {
					next(e);
				} else if ( ! record ) {
				  next(new Error('no data found!'));
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

// should use delete method
Controller.prototype.deleteAction = function () {
	var self = this;
	var config = this.initActionConfig('delete');
	
	if (config === false ) { return false; }
	
	return function (req, res, next) {
		var _id = req.params.id;
		  
		self.Table.remove(_id, function (e, record) {
			if (e) {
			  res.json(500, { error: e.message });
			} else {
			  self.decrementRecordCount();
				self.schemas.deleteFiles(record, null, function (e) {
					if (e) {
						res.json(500, { error: e.message });
					} else {
					  res.json({ redirect: self.routes.rootRoute() });
					}
				});
			}
		});
	}
}; // end of function