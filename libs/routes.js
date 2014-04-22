exports.create = create;

var path = require('path');

function create (mount, table) {
  return new Routes(mount, table);
}

function Routes (mount, table) {
  this.mount = mount;
  this.table = table;
};

Routes.prototype.rootRoute = function () {
	return path.join(this.mount, this.table);
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