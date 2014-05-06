
var should = require('should');
var icons = require('../helpers/icons');


describe('helper icons unit test', function () {

  it('test symbol', function () {
    icons.render('+').should.eql('<span class="glyphicon glyphicon-plus"></span>');
    icons.render('*').should.eql('<i class="fa fa-asterisk"></i>');
    icons.render('@').should.eql('<span class="glyphicon glyphicon-envelope"></span>');
  });

  it('test string', function () {
    icons.render('plus').should.eql('<span class="glyphicon glyphicon-plus"></span>');
    icons.render('fa-bolt').should.eql('<i class="fa fa-bolt"></i>');
  });

});