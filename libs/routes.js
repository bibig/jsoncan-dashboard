// module.exports = exports = Routes;
exports.create = create;
exports.indexRoute = indexRoute;

var path = require('path');

function indexRoute (prefix) {
  return '/' + prefix;
}

function create (prefix, table) {
  return new Routes(prefix, table);
}

function Routes (prefix, table) {
  this.prefix = prefix;
  this.table = table;
};

Routes.prototype.dashboardsRoute = function () {
	return '/' + this.prefix;
};


Routes.prototype.rootRoute = function () {
	return this.dashboardsRoute() + '/' + this.table;
};

Routes.prototype.listRoute = function (page) {
	page = page || 1;
	return path.join(this.rootRoute(), 'page/' + page);
};

Routes.prototype.addRoute = function () {
	return path.join(this.rootRoute(), 'add');
};

Routes.prototype.viewRoute = function (_id) {
	return path.join(this.rootRoute(), 'view/' + _id);
};

Routes.prototype.editRoute = function (_id) {
	return path.join(this.rootRoute(), 'edit/' + _id);
};

Routes.prototype.deleteRoute = function (_id) {
	return path.join(this.rootRoute(), 'delete/' + _id);
};

Routes.prototype.isEditAction = function (req) {
  return req.route.path == this.editRoute(':id');
};