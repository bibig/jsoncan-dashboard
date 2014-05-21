
var path   = require('path');
var Filler = require('filler');

function dropDB (fn) {
  var exec = require('child_process').exec;
  var command = 'rm -rf ' + path.join(__dirname, 'data');

  console.log('ready to drop db');
  exec(command, function(err, stdout, stderr) {
    fn();
  });
}

function rock () {
  var can = require('./can');
  var filler = new Filler(can, {
    lang: 'en',
    tables: {
      site: 1,
      articleCategories: 10,
      articles: 500
    }
  });

  console.log('ready to fill db');
  filler.run();
  console.log('done');
}

dropDB(function () {
  rock();
});