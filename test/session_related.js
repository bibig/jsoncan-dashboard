
var request    = require('supertest');
var superagent = require('superagent');
var cheerio    = require('cheerio');
var should     = require('should');
var dashboards = require('./fixtures/dashboards');
var dbName     = 'sessionRelatedDB';
var app        = dashboards.getApp(dbName);
var utils      = require('./libs/utils');
var path       = require('path');
var PATH       = path.join(__dirname, 'fixtures', 'data');
var can        = require('./fixtures/can')(dbName);
var fs         = require('fs');


describe('session session-related unit test', function () {
  var agent = request.agent(app);
  var csrf;

  after(function (done) {
    utils.clear(PATH, done);
  });

  it('get /set-session', function (done) {

    agent
      .get('/set-session')
      .expect(200)
      .end(function (e, res) {

        if (e) { console.error(e); console.log(e.stack);}

        should.not.exist(e);
        should(res.text).eql('ok');
        done();
      });
  });

  it('get /sessionRelatedTable/add  for csrf token', function (done) {
      agent
        .get('/sessionRelatedTable/add')
        .expect(200)
        .end(function (e, res) {
          var $;

          should.not.exist(e);

          $ = cheerio.load(res.text);
          csrf = $('input[name="_csrf"]').val();
          // console.log(csrf);
          done();
        });
    });

    
    it('post /sessionRelatedTable/add', function (done) {

      agent
        .post('/sessionRelatedTable/add')
        .field('sessionRelatedTable[title]', 'haha')
        .field('_csrf', csrf)
        //.expect(302)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);
          location = res.headers.location;
          // console.log(location);

          done();
        });
    });

    it('check db', function (done) {
      var arr = location.split('/'); 
      var _id = arr[arr.length - 1];

      can.open('sessionRelatedTable').find(_id).exec(function (e, record) {
        should.not.exist(e);

        should(record).be.ok;
        should(record.username).eql('superman');
        // console.log(record);
        done();

      });

    });

    it('get /sessionRelatedTable/view', function (done) {
      agent
        .get(location)
        .expect(200)
        .end(function (e, res) {
          should.not.exist(e);
          should(res.text).match(/superman/);
          should(res.text).match(/haha/);
          // console.log(res.text);
          done();
        });
    });

});