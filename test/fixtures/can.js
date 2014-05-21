
module.exports = create;

var Jsoncan = require('jsoncan');
var path = require('path');

var timestampFormat = function (s) {
  var d = new Date(s);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
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
  site: {
    adminUser: {
      type: 'string',
      max: 16,
      // default: 'admin',
      required: true,
      isInput: true
    },  
    adminPassword: {
      type: 'string',
      max: 50,
      required: true,
      // default: 'abcd1234',
      isInput: true
    },
    modified: { 
      type: 'modified',
      format: timestampFormat
    }
  },

  articleCategories: {
    seq: { 
      type: 'array',
      required: true,
      values: seqs(),
      isInput: true,
      inputType: 'select'
    },
    name: {
      type: 'string',
      required: true,
      isInput: true,
      max: 50
    },
    articlesCount: {
      type: 'int',
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
      required: true,
      isInput: true,
      inputType: 'select',
      present: 'name',
      counter: 'articlesCount'
    },
    title: {
      type: 'string',
      required: true,
      max: 100,
      isInput: true
    },
    summary: {
      type: 'string',
      required: true,
      max: 1000,
      isInput: true,
      inputType: 'textarea',
      rows: 4
    },
    content: {
      type: 'string',
      required: true,
      isInput: true,
      inputType: 'rich_textarea'
    },
    isPublic: { 
      type: 'boolean',
      default: true, 
      format: function (v) { return v ? '是' : '否'; }, 
      isInput: true, 
      inputType: 'checkbox'
    },
    hasImages: {
      type: 'boolean',
      default: false,
      format: function (v) { return v ? '是' : '否'; }, 
      isInput: true, 
      inputType: 'checkbox'
    },
    imagesCount: {
      type: 'int',
      default: 0
    },
    created :{
      type: 'created',
      format: timestampFormat
    },
    modified: {
      type: 'modified',
      format: timestampFormat
    }
  },

  articleImages: {
    id: {
      type: 'random',
      unique: true,
      index: true
    },
    _article: {
      type: 'ref',
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
      values: seqs(),
      isInput: true,
      inputType: 'select'
    },
    title: {
      type: 'string',
      required: true,
      max: 50,
      isInput: true
    },
    memo: {
      type: 'string',
      max: 1000,
      isInput: true,
      inputType: 'rich_textarea',
      rows: 3
    },
    image: {
      type: 'string',
      text: '图片', 
      max: 100,
      required: true,
      isInput: true,
      inputType: 'file',
      inputHelp: 'Please upload images under 4m',
      isImage: true,
      path: path.join(__dirname, './public/uploads/articles'), 
      url: '/uploads/articles/',
      maxFileSize: 70000,
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
      default: 0,
      format: humanFileSize
    },
    created:  { 
      type: 'created',
      format: timestampFormat
    },
    modified: { 
      type: 'modified',
      format: timestampFormat
    }
  },

  sessionRelatedTable: {
    title: {
      type: 'string',
      isInput: true,
      required: true,
      max: 40
    },
    username: {
      type: 'string',
      required: true,
      readonly: true,
      session: function (req) {
        return req.session.username;
      },

      max: 40
    }
  }
};

function create (path) {
  return new Jsoncan(path, tables);
}

