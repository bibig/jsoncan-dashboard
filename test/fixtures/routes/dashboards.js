exports.bindApp = bindApp;

var Dashboards = require('../../../index');
var can = require('../db/can');
var path = require('path');

function bindApp (app) {
  var dashboards = new Dashboards(app, can, {
    mount: '/admin',
    title: '后台管理',
    viewPath: path.join(__dirname, '../views/dashboard')
  });
  
  dashboards.add('site', {
    title: '网站信息',
    description: '维护网站的基础信息',
    max: 1,
    defaultAction: 'view'
  },{
    list: false,
    delete: false
  });
  
  dashboards.add('articleCategories', {
    title: '文章分类',
    description: '文章分类管理, 最多20个分类',
    max: 20
  }, {
    list: { 
			showFields: ['name|link', 'seq', 'articlesCount'],
      order: ['seq']
		},
		view: {
			showFields: ['name', 'seq', 'articlesCount', 'articles'],
			hasMany: {
				table: 'articles',
				title: '文章',
				viewLinkField: 'title|link',
				order: ['created', true]
			}
		}
  });
  
  dashboards.add('articles', {
    title: '文章',
    description: '文章管理',
    max: 2000
  }, {
    list: {
      showFields: ['title|link', '_articleCategory.name|link', 'isPublic', 'hasImages', 'imagesCount', 'created'],
      query: {
        name: 'articleCategories.name',
        title: '所属分类',
      },
      order: ['created', true],
      pageSize: 10
    },
    view: {
      showFields: ['id', '_articleCategory.name|link', 'title', 'summary', 'content', 'isPublic', 'hasImages', 'imagesCount', 'created', 'modified'],
      hasMany: {
        table: 'articleImages',
        title: '包含图片',
        style: 'media',
        viewLinkField: 'image|thumb|link',
        order: ['created', true]
      }
    }
  });
  
  dashboards.add('articleImages', {
		title: '文章图片',
		description: '文章图片管理',
    max: 1500
	}, {
		list: {
			showFields: ['seq', 'title', 'image|thumb|link', '_article.title|link', 'created'],
      query: {
        name: 'articles.title',
        title: '所属文章',
        filters: {
          hasImages: true,
          imagesCount: ['>', 0]
        },
        order: ['created', true]
      },
      pageSize: 10
		},
		view: {
			showFields: ['seq', 'title', 'image|image', 'memo', '_article.title|link', 'created', 'modified'],
			isFormat: true
		}
	});
  
  dashboards.addIndexPage();
} // end of bindApp;