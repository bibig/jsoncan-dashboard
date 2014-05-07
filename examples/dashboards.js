exports.bindApp = bindApp;
exports.getApp = getApp;

var Dashboards = require('../index');
var can = require('./can');
var path = require('path');
var tables = {};

tables.site = {
  basic: {
    title         : 'site info',
    description   : 'site info management',
    max           : 1,
    defaultAction : 'view'
  },
  list   : false,
  delete : false
};

tables.articleCategories =  {
  basic: {
    title       : 'article categories',
    description : 'article categories management',
    max         : 20
  },
  list: { 
    showFields : ['name|link', 'seq', 'articlesCount'],
    order      : ['seq']
  },
  view: {
    showFields: ['name', 'seq', 'articlesCount', 'articles'],
    hasMany: {
      table         : 'articles',
      title         : 'article',
      viewLinkField : 'title|link',
      order         : ['created', true]
    }
  }
};

tables.articles = {
  basic: {
    title       : 'articles',
    description : 'articles management',
    max         : 2000,
    formLayout: [['title', '_articleCategory'], 'summary', 'content', ['hasImages', 'isPublic', '__submit']]
  },
  list: {
    showFields: ['title|link', '_articleCategory.name|link', 'isPublic', 'hasImages', 'imagesCount', 'created'],
    query: {
      name  : 'articleCategories.name',
      title : '所属分类',
    },
    order    : ['created', true],
    pageSize : 10
  },
  view: {
    showFields: ['id', '_articleCategory.name|link', 'title', 'summary', 'content', 'isPublic', 'hasImages', 'imagesCount', 'created', 'modified'],
    hasMany: {
      table         : 'articleImages',
      title         : 'included images',
      style         : 'media',
      viewLinkField : 'image|thumb|link',
      order         : ['created', true]
    }
  }
};

tables.articleImages = {
  basic: {
    title       : 'article images',
    description : 'article images management',
    max         : 1500,
    // formLayout: [['title', 'seq', '_article'], 'image', 'memo']
    formLayout: [{ title : 5, seq: 2, _article: 5}, 'image', 'memo']
  }, 
  list: {
    showFields: ['seq', 'title', 'image|thumb|link', '_article.title|link', 'created'],
    query: {
      name  : 'articles.title',
      title : 'ariticle',
      order : ['created', true],
      filters: {
        hasImages: true,
        imagesCount: ['>', 0]
      }
    },
    pageSize: 10
  },
  view: {
    showFields : ['seq', 'title', 'image|image', 'memo', '_article.title|link', 'created', 'modified'],
    isFormat   : true
  }
};


function getApp () {
  var dashboards = new Dashboards(can, {
    mainSiteName: '测试网站',
    logo: '/|jsoncan-dashboard-sandbox|.:navbar-brand|i:eye-open',
    mainToolbars: [
      '/|i:th|dashboards',
      'http://www.apple.com|i:fa-apple|apple', 
      '/articles/add|i:+|articles'
    ],
    rightToolbars: ['/logout|i:off|退出'],
    footbars: ['测试网站, 权利所有'],
    stylesheets: {
      bootstrap: '/stylesheets/bootstrap.min.css',
      fa: '/stylesheets/font-awesome.min.css'
    },
    javascripts: {
      jquery: '/javascripts/jquery-1.11.0.min.js',
      bootstrap: '/javascripts/bootstrap.min.js'
    }
  }, tables);

  // dashboards.add('site', tables.site);
  dashboards.addIndexPage();
  
  return dashboards.app;

}

function bindApp (app, mount) {
  var dashboards;
  
  mount = mount || '/admin';

  dashboards = new Dashboards(can, {
    mount: mount,
    title: 'admin dashboards'
  });

  dashboards.add('site', tables.site);
  dashboards.addIndexPage();
  
  app.use(mount, dashboards.app);
}