var should = require('should');
var assert = require('assert');
var Routes = require('../libs/routes');


describe('Routes class unit test', function () {
  
  var routes = Routes.create('/mount', 'people');
  
  it('test root route', function () {
    assert.equal(routes.rootRoute(), '/mount/people');
  });
  
  it('test list route with no argument', function () {
    assert.equal(routes.listRoute(), '/mount/people/page/1');
  });
  
  it('test list route with page', function () {
    var page = 9;
    assert.equal(routes.listRoute(page), '/mount/people/page/' + page);
  });
  
  it('test list route with page and query', function () {
    var page = 9;
    var q = {a: 'b', b: 'c'};
    assert.equal(routes.listRoute(page, q), '/mount/people/page/' + page + '/?a=b&b=c');
  });
  
  it('test add route', function () {
    assert.equal(routes.addRoute(), '/mount/people/add');
  });
  
  it('test edit route', function () {
    var _id = '123';
    assert.equal(routes.editRoute(_id), '/mount/people/edit/' + _id);
  });
  
  it('test delete route', function () {
    var _id = '123';
    assert.equal(routes.deleteRoute(_id), '/mount/people/delete/' + _id);
  });

});