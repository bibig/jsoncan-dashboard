var should = require('should');
var assert = require('assert');
var Routes = require('../libs/routes');


describe('Routes class unit test', function () {
  
  var routes = Routes.create('/mount', 'people');
  
  it('test root route', function () {
    should(routes.rootRoute()).eql('/mount/people');
  });
  
  it('test list route with no argument', function () {
    should(routes.listRoute()).eql('/mount/people/page/1');
  });
  
  it('test list route with page', function () {
    var page = 9;
    should(routes.listRoute(page)).eql('/mount/people/page/' + page);
  });
  
  it('test list route with page and query', function () {
    var page = 9;
    var q = {a: 'b', b: 'c'};
    should(routes.listRoute(page, q)).eql('/mount/people/page/' + page + '/?a=b&b=c');
  });
  
  it('test add route', function () {
    should(routes.addRoute()).eql('/mount/people/add');
  });
  
  it('test edit route', function () {
    var _id = '123';
    should(routes.editRoute(_id)).eql('/mount/people/edit/' + _id);
  });
  
  it('test delete route', function () {
    var _id = '123';
    should(routes.deleteRoute(_id)).eql('/mount/people/delete/' + _id);
  });

});