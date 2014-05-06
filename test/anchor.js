
var should = require('should');
var Anchor = require('../helpers/anchor');

describe('helper anchor unit test', function () {

  it('basic test', function () {
    var args = 'http://www.google.com|google';
    var html = Anchor.render(args);

    html.should.eql('<a href="http://www.google.com">google</a>');
  });

  it('with fa icon', function () {

    Anchor.render('http://www.google.com|i:fa-camera-retro|google')
      .should.eql('<a href="http://www.google.com"><i class="fa fa-camera-retro"></i> google</a>');

    Anchor.render('http://www.google.com|google|i:fa-camera-retro')
      .should.eql('<a href="http://www.google.com"><i class="fa fa-camera-retro"></i> google</a>');

  });

  it('with glyphicon icon', function () {
    
    Anchor.render('http://www.google.com|i:search|google')
      .should.eql('<a href="http://www.google.com"><span class="glyphicon glyphicon-search"></span> google</a>');

  });

  it('with more properties define', function () {
    
    Anchor.render('http://www.google.com|i:search|.:brand|google')
      .should.eql('<a href="http://www.google.com" class="brand"><span class="glyphicon glyphicon-search"></span> google</a>');    

    Anchor.render('http://www.google.com|i:search|#:brand|google')
      .should.eql('<a href="http://www.google.com" id="brand"><span class="glyphicon glyphicon-search"></span> google</a>');    

  });

  it('with customize properties define', function () {
    
    Anchor.render('http://www.google.com|custom:search|google')
      .should.eql('<a href="http://www.google.com" custom="search">google</a>');

  });

  it('test array arguments', function () {
    var args = [
      'http://www.google.com|google',
      'http://www.github.com|github'
    ];
    var links = Anchor.render(args);
    (links.length).should.eql(2);
    links.should.eql([
      '<a href="http://www.google.com">google</a>',
      '<a href="http://www.github.com">github</a>'
    ]);
  });

  it('test with wrong args', function () {
    Anchor.render('hahaha').should.eql('hahaha');
  });

});