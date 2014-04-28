
var Jsoncan = require('jsoncan');
var path = require('path');

var timestampFormat = function (s) {
  var d = new Date(s);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') 
        + ' ' 
        + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
};

var seqs = function (num) {
	var list = [];
  num = num || 20;
	for (var i = 1; i <= num; i++) { list.push('#' + i); }
	return list;
};

var humanFileSize = function (size) {
	if (size < 1048576) { // 1m
		return parseInt(size * 10 / 1024) / 10  + 'k';
	} else {
		return parseInt(size * 10 / 1048576 ) / 10  + 'm';
	}
};

var tables = {
  
  articleCategories: {
		seq: { 
			type: 'array', 
			text: '序号', 
			required: true,
			values: seqs(),
			isInput: true,
			inputType: 'select'
		},
    name: {
      type: 'string',
      text: '分类',
      required: true,
      isInput: true,
      max: 50
    },
		articlesCount: {
			type: 'int',
			text: '文章数',
			default: 0,
			required: true
		}
  },
  
  articles: {
    id: {
      type: 'random',
      text: 'id',
      required: true,
      unique: true,
      size: 10
    },
    _articleCategory: {
      type: 'ref',
      text: '分类',
      required: true,
      isInput: true,
      inputType: 'select',
      present: 'name',
      counter: 'articlesCount'
    },
    title: {
      type: 'string',
      text: '标题',
      require: true,
      max: 100,
      isInput: true
    },
    summary: {
      type: 'string',
      text: '简介',
      require: true,
      max: 1000,
      isInput: true,
      inputType: 'textarea',
      rows: 3
    },
    content: {
      type: 'string',
      text: '内容',
      required: true,
      isInput: true,
      inputType: 'textarea'
    },
    isPublic: { 
			type: 'boolean', 
			text: '是否发布', 
			default: true, 
			format: function (v) { return v ? '是' : '否'}, 
			isInput: true, 
			inputType: 'checkbox'
		},
    hasImages: {
      type: 'boolean', 
			text: '是否有图片', 
			default: false,
			format: function (v) { return v ? '是' : '否'}, 
			isInput: true, 
			inputType: 'checkbox',
      inputHelp: '标记“有图片”后，可以在文章图片模块中上传相关图片'
    },
    imagesCount: {
			type: 'int',
			text: '图片数',
			default: 0
		},
    created :{
      type: 'created',
      text: '创建时间',
      format: timestampFormat
    },
    modified: {
      type: 'modified',
      text: '更新时间',
      format: timestampFormat
    }
  },

  articleImages: {
    id: {
			type: 'random',
			text: '编号',
			unique: true,
			index: true
		},
		_article: {
			type: 'ref', 
			text: '所属文章',
			required: true, 
			isInput: true, 
			inputType: 'select', 
			present: 'title',
      // ref: 'articles',
			counter: 'imagesCount',
      prepare: {
        select: ['title'],
        filters: { hasImages: true, isPublic: false },
        order: ['created', true]
      }
		},
		seq: {
			type: 'array',
			text: '序号',
			values: seqs(),
			isInput: true,
			inputType: 'select'
		},
		title: {
			type: 'string',
			text: '图片标题',
			isInput: true
		},
		memo: {
			type: 'string',
			text: '图片备注',
			max: 1000,
			isInput: true
		},
		image: {
			type: 'string',
			text: '图片', 
			max: 100,
			required: true,
			isInput: true,
			inputType: 'file',
      inputHelp: '请上传小于4m的图片',
			isImage: true,
			path: path.join(__dirname, '../public/uploads/articles'), 
			url: '/uploads/articles/',
			maxFileSize: 4* 1024 * 1024,
			exts: ['jpg', 'jpeg', 'gif', 'png'],
			sizeField: 'size',
      // cropImage: 'Center',
      // isFixedSize: true,
			imageSize: [600, 400],
			thumbSize: [100],
			hasThumb: true,
			thumbPath: false // use default
		},
		size: {
			type: 'int',
			text: '大小',
			default: 0,
			format: humanFileSize
		},
		created:  { 
			type: 'created',
      text: '创建时间',
			format: timestampFormat
		},
    modified: { 
			type: 'modified', 
      text: '更新时间',
			format: timestampFormat
		}
  },
  site: {
    adminUser: {
      type: 'string',
      text: '管理账号',
      max: 16,
      default: 'admin',
      isInput: true
    },  
    adminPassword: {
      type: 'string',
      text: '管理密码',
      max: 50,
      default: '111',
      isInput: true
    },
    modified: { 
			type: 'modified',
      text: '更新时间',
			format: timestampFormat
		}
  }
};

module.exports = new Jsoncan(path.join(__dirname, 'data'), tables);