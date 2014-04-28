var can = require('./fixtures/db/can.js');
var app = require('./fixtures/app');
var request = require('supertest');

describe('GET /jsontest', function () {
  it('respond with json', function (done) {
    request(app)
      .get('/jsontest')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(function (res) {
        console.log('expect res');
        console.log(arguments);
      })
      .end(done);
  });
});