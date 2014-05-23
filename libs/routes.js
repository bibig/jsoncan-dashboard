exports.create = create;

var path = require('path');

function create (mount, table) {
  return new Routes(mount, table);
}

function Routes (mount, table) {
  this.mount = mount || '/';
  this.table = table;
}

function getRouteWithQueries (route, query) {
  var q = [];

  if (query) {
  
    Object.keys(query).forEach(function (key) {
      q.push(key + '=' + query[key]);
    });

    if (q.length > 0) {
      route = path.join(route, '?' + q.join('&'));
    }
  }

  return route;
}

Routes.prototype.rootRoute = function () {
  return path.join(this.mount, this.table);
};

Routes.prototype.listRoute = function (page, query) {
  var route = path.join(this.rootRoute(), 'page/' + ( page || 1 ));
  
  return getRouteWithQueries(route, query);
};

Routes.prototype.addRoute = function (query) {
  var route = path.join(this.rootRoute(), 'add');
  
  return getRouteWithQueries(route, query);
};

Routes.prototype.viewRoute = function (_id) {
  return path.join(this.rootRoute(), 'view/' + _id);
};

Routes.prototype.editRoute = function (_id) {
  return path.join(this.rootRoute(), 'edit/' + _id);
};

Routes.prototype.uploadRoute = function (field, _id) {
  return path.join(this.rootRoute(), 'upload/' + field + '/' + _id);
};

Routes.prototype.deleteRoute = function (_id) {
  return path.join(this.rootRoute(), 'delete/' + _id);
};

Routes.prototype.isEditAction = function (req) {
  return req.route.path == this.editRoute(':id');
};