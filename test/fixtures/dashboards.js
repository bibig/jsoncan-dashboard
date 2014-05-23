exports.getApp = getApp;

var Dashboards = require('../../index');

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
    dropdown: {
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
    dropdown: {
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

tables.sessionRelatedTable = {
  basic: {
    title: 'session related table',
    description: 'session related table management',
    max: 100,
    formLayout: ['title']
  },
  list: {
    filters: {},
    sessionFilters: {
      username: function (req) { return req.session.username; }
    }
  },
  view: {
    showFields: ['title', 'username']
  }
};


function getApp (can) {
  var dashboards = new Dashboards(can, {
    mainSiteName  : '测试网站',
    logo          : '/|xxxx网站|.:navbar-brand|i:eye-open',
    footbars      : ['测试网站, 权利所有'],
    rightToolbars : ['/logout|i:off|退出'],
    mainToolbars  : [
      '/|i:th|dashboards',
      'http://www.apple.com|i:fa-bolt|apple', 
      'http://www.google.com|i:@|google'
    ],
    multipart: {
      uploadDir: path.join(__dirname, './tmp')
    }
  }, tables);

  // dashboards.add('site', tables.site);
  
  dashboards.app.get('/set-session', function (req, res, next) {
    req.session.username = 'superman';
    res.send('ok');
  });

  dashboards.addIndexPage();
  
  
  return dashboards.app;

}