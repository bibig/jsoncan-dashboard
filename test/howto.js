var request = require('supertest');
var should = require('should');
var express = require('express');
var cookieParser = require('cookie-parser');

describe('request.agent(app)', function () {
  var app = express();
  
  app.use(cookieParser());
  
  app.get('/', function (req, res) {
    res.cookie('cookie', 'hey');
    res.send();
  });
  
  app.get('/return', function (req, res) {
    if (req.cookies.cookie) res.send(req.cookies.cookie);
    else res.send(':(');
  });
  
  var agent = request.agent(app);
  
  it('should save cookies', function (done) {
    agent
      .get('/')
      .expect(function (res) {
        console.log(res.headers['set-cookie']);
      })
      .expect('set-cookie', 'cookie=hey; Path=/', done);
      //.end(done);
  });
  
  it('should send cookies', function (done) {
    agent
      .get('/return')
      .expect('hey', done);
  });
  
});