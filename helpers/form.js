exports.render = render;

var inputs = require('./inputs');
var grids = require('./grids');
var Html = require('htmler');
var utils = require('../libs/utils');

function render (tableName, config) {
	var showFields = config.showFields;
	var schemas = config.schemas;
	var data = config.data || {};
	var errors = config.errors || {};
	var scriptHtmls;
	var inputHtmls = '';
	var extraHtmls = '';
	var inputFields = {};
	var formProperties = {
	  id: 'jdb-form',
		role: 'form',
		method: 'post',
		action: config.action
	};
	var richTexts = []; //tinymcr fields, dom id
	var formLayout = config.formLayout || showFields;
	var submitName = '__submit';
	
	if (schemas.hasUploadField()) {
		formProperties.enctype = "multipart/form-data";
	}
	
	schemas.forEachField(function (name, field) {
		var args, value = data[name];
		if (value == undefined && field.default !== undefined) {
			value = field.default;
		}
		args = [tableName, field, value, errors[name]];
		switch(field.inputType) {
		  case 'rich_textarea':
		    inputFields[name] = inputs.textarea.apply(this, args);
		    richTexts.push('#input_' + name);
				break;
			case 'textarea':
				inputFields[name] = inputs.textarea.apply(this, args);
				break;
			case 'select':
				inputFields[name] = inputs.select.apply(this, args);
				break;
			case 'file':
				inputFields[name] = inputs.file.call(this, field, errors[name]);
				break;
			case 'checkbox':
				inputFields[name] = inputs.checkbox.apply(this, args);
				break;
			case 'radio':
				inputFields[name] = inputs.radio.apply(this, args);
				break;
			case 'text':
			default:
				inputFields[name] = inputs.text.apply(this, args);
				break;
		}	
	}, showFields);
	
	inputFields[submitName] = Html.input({
	  id: 'jdb-submit',
		type: 'submit',
		class: 'btn btn-primary btn-block btn-lg',
		value: '保存' 
	});
	
  formLayout.forEach(function (row) {
    var fields = [];
    if (Array.isArray(row)) {
      row.forEach(function (name) {
        var multi = name.split(',');
        var multiItems = '';
        if (multi.length > 1) {
          multi.forEach(function (name) {
            multiItems += inputFields[utils.trim(name)];
          });
          fields.push(multiItems);
        } else {
          fields.push(inputFields[name]);
        }
      });
      inputHtmls += grids.renderCols(fields);
    } else {
      inputHtmls += inputFields[row];
    }
  });
  
  if (inputHtmls.indexOf('type="submit"') == -1) {
    inputHtmls += inputFields[submitName];
  }
	  	
	// 当checkbox没有被选中时， req.body里面会找不到这个字段。比如:有一个name='status'的checkbox，不选择提交后，req.body.status是undefined
	// 加一个_fields，就是告诉服务端，这个form里面有哪些字段。
	extraHtmls += Html.input({name: "_fields", type: 'hidden', value: showFields.join(',')});
	if (config.token) {
	  extraHtmls += Html.input({name: "_csrf", type: 'hidden', value: config.token});
  }
	
	scriptHtmls = Html.script().html('$(function () { jd.onlySubmitOnce("jdb-form", "jdb-submit"); });');
	
	if (richTexts.length > 0) {
	  scriptHtmls += Html.script().html('$(function () { jd.richText("' + richTexts.join(',') + '") });');
	}
	
	return Html.form(formProperties).html(inputHtmls, extraHtmls) + scriptHtmls;
}