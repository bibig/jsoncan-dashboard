var request    = require('supertest');
var superagent = require('superagent');
var cheerio    = require('cheerio');
var should     = require('should');
var dashboards = require('./fixtures/dashboards');
var dbName     = 'data';
var app        = dashboards.getApp(dbName);
var utils      = require('./libs/utils');
var path       = require('path');
var PATH       = path.join(__dirname, 'fixtures', 'data');
var can        = require('./fixtures/can')(dbName);
var fs         = require('fs');

var uploadTmpPath = path.join(__dirname, '../tmp');


describe('<basic test>', function () {
  after(function (done) {
    utils.clear(PATH, done);
  });

  describe('get static assets', function () {
    it('get /dashboards-assets/javascripts/jsoncan-dashboard.js', function (done) {
      request(app)
        .get('/dashboards-assets/javascripts/jsoncan-dashboard.js')
        .expect(200)
        .expect('Content-Type', /javascript/)
        .end(function (e, res) {
          should.not.exist(e);
          // console.log(res.headers);
          done();  
        });
    });
  });

  describe('get index page', function () {
    it('should response to index page', function (done) {
      // dashboards.bindApp(app, mount);
      request(app)
        .get('/')
        .expect(200)
        .end(function (e, res) {
          should.not.exist(e);
          // console.log(res.text);
          done();
        });
    });
  });

  describe('site table', function () {
    var agent         = request.agent(app);
    var adminUser     = 'admin';
    var adminPassword = '123';
    var csrf, location;

    this.timeout(5000);
    
    it('get /site', function (done) {
      agent
        .get('/site')
        .expect(302)
        .end(function (e, res) {
          should.not.exist(e);
          // console.log(res.text);
          location = res.headers.location;
          // console.log(res.headers);
          should(location).eql('/site/add');
          done();
        });
    });

    it('prepare for adding site info', function (done) {
      agent
        .get('/site/add')
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          should.not.exist(e);
          var $ = cheerio.load(res.text);
          csrf = $('input[name="_csrf"]').val();
          // console.log(csrf);
          done();
        });

    });
   
    it('adding new site info with unfilled fields', function (done) {
      agent
        .post('/site/add')
        .field('site[adminPassword]', adminPassword)
        .field('_csrf', csrf)
        .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          // console.log(res.headers);
          // console.log(res.text);
          should.not.exist(e);
          done();
        });
    });

    it('adding new site info', function (done) {
      agent
        .post('/site/add')
        .field('site[adminUser]', adminUser)
        .field('site[adminPassword]', adminPassword)
        .field('_csrf', csrf)
        .expect(302)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          should.not.exist(e);
          // console.log(res.headers);
          // console.log(res.text);
          location = res.headers.location;
          done();
        });
    });

    it('get /site/:id  view page for just added record', function (done) {
      agent
        .get(location)
        .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          should.not.exist(e);
          
          var $ = cheerio.load(res.text);
          should(adminUser).eql($('.td-adminUser', '#view-site').html());
          should(adminPassword).eql($('.td-adminPassword', '#view-site').html());
          done();
        });
    });
  }); // end of describe

  describe('test for table articleCategories', function () {
    var agent = request.agent(app);
    var csrf;
    var location;

    this.timeout(5000);

    it('get /articleCategories', function (done) {
      agent
        .get('/articleCategories')
        .expect(200)
        .end(function (e, res) {
          should.not.exist(e);
          // console.log(res);
          done();
        });
    });

    it('get /articleCategories/add  for csrf token', function (done) {
      agent
        .get('/articleCategories/add')
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

    
    it('post /articleCategories/add', function (done) {
      var cat = 'category1';

      agent
        .post('/articleCategories/add')
        .field('articleCategory[name]', cat)
        .field('articleCategory[seq]', 1)
        .field('_csrf', csrf)
        .expect(302)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);
          location = res.headers.location;

          done();
        });
    });

    it('get /articles/view', function (done) {
      agent
        .get(location)
        .expect(200, done);
    });

  }); // end of describe

  describe('test for table articles', function () {
    var agent = request.agent(app);
    var csrf;
    var location;
    var record = {
      title: 'first article',
      summary: 'this is a summary',
      content: 'this is a content',
      hasImages: 'on'
    };

    this.timeout(5000);

    it('get /articles/add', function (done) {
      agent
        .get('/articles/add')
        .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          should.not.exist(e);

          $ = cheerio.load(res.text);
          csrf = $('input[name="_csrf"]').val();
          
          record._category = $('#input__articleCategory').children().last().val();
          
          ($('#input__articleCategory').find('option').length).should.equal(2);
          (record._category).should.ok;

          // console.log(record._category);
          done();

        });
    });

    it('post /articles/add', function (done) {
      // console.log(record);
      agent
        .post('/articles/add')
        .field('article[_articleCategory]', record._category)
        .field('article[title]', record.title)
        .field('article[summary]', record.summary)
        .field('article[content]', record.content)
        .field('article[hasImages]', record.hasImages)
        .field('_csrf', csrf)
        .expect(302)
        .end(function (e, res) {
          
          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);
          location = res.headers.location;
          // console.log(location);
          done();

        });
    });

    it('check articles db', function () {
      var data = can.open('articles').query().execSync()[0];

      data.should.have.property('title', record.title);
      data.should.have.property('summary', record.summary);
      data.should.have.property('content', record.content);
      data.should.have.property('hasImages', true);
      data.should.have.property('isPublic', false);
      data.should.have.property('imagesCount', 0);
      data.should.have.property('created');
      data.should.have.property('modified');
      data.should.have.property('_id');

      location.should.eql('/articles/view/' + data._id);
    });

    it('get /articles/view', function (done) {
      agent
        .get(location)
        .expect(200, done);
    });

  }); // end of describe

  describe('test for articleImages', function () {
    var agent = request.agent(app);
    var csrf;
    var location;
    var record = {
      title: 'first article',
      memo: 'this is a memo',
      seq: '1'
    };
    var imageLocalPath = path.join(__dirname, './fixtures/uploads/articles');

    this.timeout(5000);

    before(function (done) {
      utils.clear(imageLocalPath, done);
    });

    after(function (done) {
      // utils.clear(imageLocalPath, done);
      done();
    });

    it('get /articleImages/add', function (done) {
      agent
        .get('/articleImages/add')
        .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);
          $ = cheerio.load(res.text);
          csrf = $('input[name="_csrf"]').val();
          record._article = $('#input__article').children().last().val();
          // console.log(record);
          (record._article).should.ok;

          done();
        });
    });

    it('post /articleImages/add, when form validate failed, should clear uploaded image', function (done) {
      var imagesPath = path.join(__dirname, './fixtures/uploads/articles');
      var thumbsPath = path.join(imagesPath, './thumbs');

      agent
        .post('/articleImages/add')
        .field('articleImage[seq]', record.seq)
        // .field('articleImage[title]', record.title) // will miss title field value
        .field('articleImage[memo]', record.memo)
        .field('articleImage[_article]', record._article)
        .field('_csrf', csrf)
        .attach('image', path.join(__dirname, './fixtures/images/small.jpg'))
        // .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);

          // console.log(fs.readdirSync(uploadTmpPath));

          should(fs.readdirSync(imagesPath).length).eql(1); // 1 refer to 'thumbs' sub-folder
          should(fs.readdirSync(thumbsPath).length).eql(0);
          should(fs.readdirSync(uploadTmpPath).length).eql(0);
          
          // console.log(res.req.files);
          // console.log(res.headers);
          done();
        });
    });

    it('post /articleImages/add, when image is invalid, should clear tmp source file', function (done) {

      agent
        .post('/articleImages/add')
        .field('articleImage[seq]', record.seq)
        .field('articleImage[title]', record.title)
        .field('articleImage[memo]', record.memo)
        .field('articleImage[_article]', record._article)
        .field('_csrf', csrf)
        .attach('image', path.join(__dirname, './fixtures/images/big.png'))
        // .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          // console.log(res.text);
          should(res.text).match(/文件太大/);
          should.not.exist(e);

          should(fs.readdirSync(uploadTmpPath).length).eql(0);
          // console.log(res.headers);
          done();
        });
    });
    
    it('post /articleImages/add', function (done) {
      agent
        .post('/articleImages/add')
        .field('articleImage[seq]', record.seq)
        .field('articleImage[title]', record.title)
        .field('articleImage[memo]', record.memo)
        .field('articleImage[_article]', record._article)
        .field('_csrf', csrf)
        .attach('image', path.join(__dirname, './fixtures/images/small.jpg'))
        .expect(302)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);
          location = res.headers.location;
          should(fs.readdirSync(uploadTmpPath).length).eql(0);
          // console.log(res.headers);
          done();
        });
    });

    it('check database and files after add', function () {
      var data = can.open('articleImages').query().execSync()[0];

      data.should.have.property('_article', record._article);
      data.should.have.property('seq', record.seq);
      data.should.have.property('memo', record.memo);
      data.should.have.property('title', record.title);
      data.should.have.property('size');
      data.should.have.property('created');
      data.should.have.property('modified');
      data.should.have.property('_id');

      fs.existsSync(path.join(imageLocalPath, data.image)).should.be.true;
      fs.existsSync(path.join(imageLocalPath, 'thumbs', data.image)).should.be.true;

      location.should.eql('/articleImages/view/' + data._id);
      record._id = data._id;
      record.image = data.image;
      // console.log(data);
    });

    it('get /articleImages/view', function (done) {
      agent
        .get(location)
        .expect(200, done);
    });

    

    it('get /articleImages/edit/:id', function (done) {
      agent
        .get('/articleImages/edit/' + record._id)
        .expect(200)
        .end(function (e, res) {
          
          if (e) { console.error(e); console.log(e.stack);}
          // console.log(res.text);
          should.not.exist(e);

          $ = cheerio.load(res.text);
          csrf = $('input[name="_csrf"]').val();
          done();
        });
    });

    it('post /articleImages/edit/:id', function (done) {

      record.title = 'updated title';
      record.seq = 2;

      agent
        .post('/articleImages/edit/' + record._id)
        .field('articleImage[title]', record.title)
        .field('articleImage[seq]', record.seq)
        .field('articleImage[memo]', record.memo)
        .field('articleImage[_article]', record._article)
        .field('_csrf', csrf)
        .expect(302)
        .end(function(e, res) {
          
          if (e) { console.error(e); console.log(e.stack);}
          should.not.exist(e);

          // console.log(res.headers);
          done();
        });
    });

    it('delete /articleImages/:id', function (done) {
      agent
        .del('/articleImages/delete/' + record._id)
        .set('X-CSRF-Token', csrf)
        // .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (e, res) {

          if (e) { console.error(e); console.log(e.stack);}

          // console.log(res.headers);
          // console.log(res.text);
          should.not.exist(e);
          res.text.should.match(/redirect/);
          done();

        });
    });

    it('check database and files after delete', function () {
      var count = can.open('articleImages').countSync();

      count.should.eql(0);

      fs.existsSync(path.join(imageLocalPath, record.image)).should.be.false;
      fs.existsSync(path.join(imageLocalPath, 'thumbs', record.image)).should.be.false;
      // console.log(record);
    });

  }); // end of describe

});