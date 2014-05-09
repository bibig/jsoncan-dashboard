exports.create = create;
exports.indexPage = indexPage;


var yi         = require('yi');
var inflection = require('inflection');
var async      = require('async');
var path       = require('path');
var debug      = require('debug')('dashboard');

var helpers    = require('../helpers');
var Routes     = require('./routes');
var Views      = require('./views');
var Schemas    = require('./schemas');
var Present    = require('./present');
var Upload     = require('./upload');


function indexPage (dashboards) {
  var routesMap = {};
  var tables    = Object.keys(dashboards.tables);
  var mount     = dashboards.config.mount;
  var indexAction;
  
  if (tables.length === 0) { return; }
  
  tables.forEach(function (name) {
    routesMap[name] = Routes.create(mount, name);
  });
  
  indexAction = function (req, res, next) {
    var locals = {};
    
    locals.list = helpers.grids.renderDashboards(dashboards.tables, routesMap);
    
    res.render('index.html', locals);
  };
  
  dashboards.app.get('/', indexAction);
}

function create (dashboards, name) {
  return new Controller(dashboards, name);
}

function Controller (dashboards, name) {
  this.dashboards      = dashboards;
  this.tableName       = name;
  this.Table           = dashboards.can.open(name);
  this.settings        = dashboards.tables[name];
  this.mount           = dashboards.config.mount;
  this.schemas         = Schemas.create(this.Table.getFields());
  this.routes          = Routes.create(this.mount, name);
  this.views           = Views.create(this);
  this.middlewaresData = {};
  
  // set all settings config
  this.setActionConfig('list'); 
  this.setActionConfig('view'); 
  this.setActionConfig('edit'); 
  this.setActionConfig('add');
  this.setActionConfig('delete');
  
  this.hasListAction   = this.settings.list ? true : false;
  this.hasViewAction   = this.settings.view ? true : false;
  this.hasAddAction    = this.settings.add ? true : false;
  this.hasEditAction   = this.settings.edit ? true : false;
  this.hasDeleteAction = this.settings.delete ? true : false;
  this.defaultAction   = this.settings.basic.defaultAction || 'list'; 
  
  if (this.settings.max) {
    this.setRecordCount();
  }
}

Controller.prototype.setActionConfig = function (name, defaults) {
  var config = this.settings[name];
  
  if (config === false) {
    return;
  }
  
  if ( config === undefined) {
    config = this.settings[name] = {};
  }
  
  defaults = defaults || {
    tableName  : this.tableName,
    mount      : this.mount,
    routes     : this.routes, // should remove
    schemas    : this.schemas, // should remove
    showFields : this.schemas.inputFields(),
    locals     : {}
  };
  
  switch (name) {
    case 'view':
      defaults.isFormat = true;
      break;
    case 'edit':
      defaults.formLayout = this.settings.basic.formLayout;
      break;
    case 'add':
      defaults.formLayout = this.settings.basic.formLayout;
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
  
  
  yi.merge(config, defaults);
  
  this.middlewaresData[name] = {};
};

/**
 * completed list action要经历一下步骤
 * step 1: render dropdown for request query
 * step 2: render main table for records
 * step 3: render pagination
 * step 4: render view for browser
 * @params:
      config.locals
      config.query
      config.filters
      dashboard
 */

Controller.prototype.enableListAction = function () {
  var middlewares = [];
  var queryDropdownStep, mainTableStep, paginationStep, finalStep;
  
  if ( ! this.hasListAction ) { return; }
  
  queryDropdownStep = this.listActionRenderDropdownStep();
  mainTableStep     = this.listActionRenderMainTableStep();
  paginationStep    = this.listActionRenderPaginationStep();
  finalStep         = this.listActionFinalStep();
  
  if (queryDropdownStep) {  middlewares.push(queryDropdownStep); }

  if (mainTableStep) {  middlewares.push(mainTableStep); }

  if (paginationStep) {  middlewares.push(paginationStep); }
  
  if (this.defaultAction == 'list') {
    this.dashboards.app.get('/' + this.tableName, middlewares, finalStep);
  }
  
  this.dashboards.app.get('/' + this.tableName + '/page/:page', middlewares, finalStep);
};

Controller.prototype.enableAddAction = function () {
  var middlewares = [];
  
  if ( ! this.hasAddAction ) { return; }
    
  if (this.settings.max) { 
    middlewares.push(this.checkMaxAction()); 
  }
  
  if (this.schemas.hasUploadField()) {
    middlewares.push(this.uploadAction());
  }
      
  middlewares.push(this.saveAction());
  this.dashboards.app.all('/' + this.tableName + '/add', middlewares, this.addAction());
};

Controller.prototype.enableEditAction = function () {
  var middlewares = [];
  
  if ( ! this.hasEditAction ) { return; }
    
  if (this.schemas.hasUploadField()) {
    middlewares.push(this.uploadAction());
  }
  
  middlewares.push(this.saveAction());
  
  this.dashboards.app.all('/' + this.tableName + '/edit/:id', middlewares, this.editAction());
};

Controller.prototype.enableDeleteAction = function () {
  if ( ! this.hasDeleteAction ) { return; }

  this.dashboards.app.delete('/' + this.tableName + '/delete/:id', this.deleteAction());
};

Controller.prototype.enableViewAction = function () {
  var view;

  if ( ! this.hasViewAction ) { return; }
  
  view = this.viewAction();

  if (this.defaultAction == 'view') { // for only one record table
    this.dashboards.app.get('/' + this.tableName, view);
  }
  
  this.dashboards.app.get('/' + this.tableName + '/view/:id', view);
};

Controller.prototype.enable = function () {
  this.enableListAction();
  this.enableViewAction();
  this.enableAddAction();
  this.enableEditAction();
  this.enableDeleteAction();
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



Controller.prototype.listActionRenderDropdownStep = function () {
  var config = this.settings.list;
  var self = this;
  
  if ( ! config.query ) { return false; }
  
  return function (req, res, next) {
    var info        = config.query.name.split('.');
    var fieldName   = info[1] ? self.schemas.getReferenceField(info[0]) : info[0];
    var queryConfig = {
      title        : config.query.title,
      currentValue : req.query[fieldName],
      qname        : config.query.ref || fieldName,
      routes       : self.routes
    };
    var table, textField, fields, query, schemaDefinedValues;
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
      queryConfig.textField = info[0];
      self.middlewaresData.list.queryDropdown = helpers.list.renderFilterDropdown(schemaValuesToRecords(schemaDefinedValues, info[0]), queryConfig);
      next();
    } else {
      table = info[0];
      textField = info[1];
      fields = ['_id', textField];
      query = self.dashboards.can.open(table).query(config.query.filters || {}).select(fields).limit(config.query.limit || 50);
    
      if (config.query.order) {
        query.order(config.query.order[0], config.query.order[1] || false);
      }
    
      query.exec(function (e, records) {
        // var queryConfig;
        if (e) { next(e); } else if (records.length === 0) { next(); } else  {
          queryConfig.textField = textField;
          self.middlewaresData.list.queryDropdown = helpers.list.renderFilterDropdown(records, queryConfig);
          next();
        }
      });
    }
  };
};

Controller.prototype.listActionRenderMainTableStep = function () {
  var config = this.settings.list;
  var self   = this;
  
  return function (req, res, next) {
    var currentPage    = parseInt( req.params.page || 1 , 10);
    // will use for querying records and querying count
    var filters        = self.schemas.safeFilters(req.query || {});
    var selectFields   = Present.getFieldNames(config.showFields);
    var referenceNames = self.schemas.getReferenceNames(selectFields);
    var skip, query;
  
    if (selectFields.indexOf('_id') == -1) {
      selectFields.unshift('_id');
    }
    
    yi.merge(filters, config.filters);
    
    skip = (currentPage - 1) * config.pageSize;
    query = self.Table.query(filters)
              .select(selectFields)
              .skip(skip)
              .limit(config.pageSize);

    referenceNames.forEach(function (name) {
      query.ref(name);
    });
  
    if (Array.isArray(config.order)) {
      query.order(config.order[0], config.order[1] || false);
    }
  
    if (config.isFormat) {
      query.format();
    }
  
    query.exec(function (e, records) {
      if (e) { next(e); } else {
        config.hasEditAction                = !config.readonly ? self.hasEditAction : false;
        config.hasDeleteAction              = !config.readonly ? self.hasDeleteAction : false;
        config.token                        = self.csrfToken(req);
        self.middlewaresData.list.mainTable = helpers.list.renderTable(records, config);
        next(e);
      }
    });
  };
};

Controller.prototype.listActionRenderPaginationStep = function () {
  var config = this.settings.list;
  var self   = this;
  
  if ( ! config.showPage) { return false; }
  
  return function (req, res, next) {
    var currentPage = parseInt( req.params.page || 1 , 10);
    // will use for querying records and querying count
    var filters = self.schemas.safeFilters(req.query || {});

    yi.merge(filters, config.filters);
    
    self.Table.query(filters).count(function (e, count) {
      var pageCount;

      if (e) { next(e);} else {
        pageCount = Math.ceil(count / config.pageSize);
        self.middlewaresData.list.pagination = helpers.pages.render(
          currentPage,
          pageCount,
          function (page) { return self.routes.listRoute(page, req.query); }
        );
        next();
      }
    });
  };
};

Controller.prototype.listActionFinalStep = function () {
  var config = this.settings.list;
  var self = this;
  
  return function (req, res, next) {
    var locals     = yi.clone(config.locals);
    var addLinkUrl = (self.hasAddAction && self.isAvailableForAdd()) ? self.routes.addRoute(req.query) : false;
    var addLink    = helpers.list.renderAddLink(addLinkUrl);
    
    locals.list  = self.middlewaresData.list.mainTable || '';
    locals.pages = self.middlewaresData.list.pagination || '';
    locals.title = helpers.list.renderTitle(self.views.viewTitle('list'), addLink, self.middlewaresData.list.queryDropdown || '');

    self.views.render(res, 'list', locals);
  };
};

Controller.prototype.viewAction = function () {
  var self = this;
  var config = this.settings.view;

  if (config === false ) { return false; }
  
  return function (req, res, next) {
    var _id            = req.params.id || null;
    var locals         = yi.clone(config.locals);
    var selectFields   = Present.getFieldNames(config.showFields);
    var referenceNames = self.schemas.getReferenceNames(selectFields);
    var query;
    
    function _render (record) {
      var hasManyRoutes;

      config.hasAddAction    = self.hasAddAction ? self.isAvailableForAdd() : false;
      config.hasEditAction   = !config.readonly ? self.hasEditAction : false;
      config.hasDeleteAction = !config.readonly ? self.hasDeleteAction : false;
      
      if (config.hasMany) {
        config.hasMany.routes   = Routes.create(self.mount, config.hasMany.table);
        config.hasMany.readonly = true;
        config.hasMany.schemas  = Schemas.create(self.dashboards.can.open(config.hasMany.table).getFields());
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
          if (!_id) {
            res.redirect(self.routes.addRoute());
          }
        }

        _render(record);
      }

    }); // end of finder
  }; // end of return
};

Controller.prototype.getPostData = function (req) {
  return req.body[inflection.singularize(this.tableName)] || {};
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
            yi.merge(self.getPostData(req), self.schemas.getFileRelatedData(record));
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
            yi.merge(self.getPostData(req), upload.data);
            if (_id) {// edit mode, should delete old file
              self.Table.find(_id).exec(function (e, record) {
                
                if (e) {
                  next(e);
                } else {
                  // delete old image files
                  console.log('ready to delete old files');
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
        yi.merge(req.errors, upload.errors);
        upload.clear(next);
      } // end of if (upload.validate())
    } else { // end of if(req.files)
      next();
    }
    
  };
};

Controller.prototype.setReferencesValues = function (showFields, callback) {
  var refs      = this.schemas.getReferences(showFields);
  var tasks     = Object.keys(refs);
  var allValues = {};
  var self      = this;
  var setFn     = function (name, callback) {
    var info  = refs[name];
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
  var self   = this;
  var config = this.settings.add;

  if (config === false ) { return false; }
  
  return function (req, res, next) {
    config.data = {};
    yi.merge(config.data, self.getPostData(req));
    yi.merge(config.data, req.query);
    config.errors = req.errors || {};
    config.action = self.routes.addRoute();
    
    function renderForm () {
      var locals = yi.clone(config.locals);

      config.token  = self.csrfToken(req);
      locals.form   = helpers.form.render(self.Table.table, config);
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
  };
};

Controller.prototype.saveAction = function () {
  var self = this;
  
  return function (req, res, next) {
    var isNew = true;
    var _id   = req.params.id;
    var data  = self.getPostData(req);
    var model;
    var validFields;

    req.errors = req.errors || {};

    if (req.method == 'GET') { return next(); }
    
    if (data) {

      if (_id) {
        data._id = _id; 
        isNew = false;
        validFields = self.settings.edit.showFields;
      } else {
        validFields = self.settings.add.showFields;
      }
      
      data = self.schemas.convert(data, validFields);
      data = self.schemas.sanitize(data);
      model = self.Table.create(data);

      if (Object.keys(req.errors).length === 0 && model.validate()) {
        
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
        yi.merge(req.errors, model.errors);
        
        if (yi.isNotEmpty(req.files)) {
          self.schemas.deleteFiles(data, null, next);
        } else {
          next();
        }
      } 
    } // end of if (data)
  }; // end of return

};

Controller.prototype.editAction = function () {
  var self = this;
  var config = this.settings.edit;
  
  if (config === false ) { return false; }
  
  return function (req, res, next) {
    var _id = req.params.id;
    var locals = yi.clone(config.locals);
    
    if (!_id) {
      return next(new Error('invalid param found'));
    }
    
    function renderForm () {
      config.errors = req.errors || {};
      config.action = self.routes.editRoute(_id);
      config.token  = self.csrfToken(req);
      locals.form   = helpers.form.render(self.Table.table, config);

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
  var config = this.settings.delete;
  
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
  };
}; // end of function