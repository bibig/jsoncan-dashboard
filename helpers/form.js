exports.render = render;

var inputs = require('./inputs');
var Html = require('htmler');

function render (tableName, config) {
	var showFields = config.showFields;
	var schemas = config.schemas;
	var data = config.data || {};
	var errors = config.errors || {};
	var inputHtmls = [];
	var formProperties = {
		role: 'form',
		method: 'post',
		action: config.action
	};
	
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
			case 'textarea':
				inputHtmls.push(inputs.textarea.apply(this, args));
				break;
			case 'select':
				inputHtmls.push(inputs.select.apply(this, args));
				break;
			case 'file':
				inputHtmls.push(inputs.file.call(this, field, errors[name]));
				break;
			case 'checkbox':
				inputHtmls.push(inputs.checkbox.apply(this, args));
				break;
			case 'radio':
				inputHtmls.push(inputs.radio.apply(this, args));
				break;
			case 'text':
			default:
				inputHtmls.push(inputs.text.apply(this, args));
				break;
		}	
	}, showFields);
	
	// 当checkbox没有被选中时， req.body里面会找不到这个字段。比如:有一个name='status'的checkbox，不选择提交后，req.body.status是undefined
	// 加一个_fields，就是告诉服务端，这个form里面有哪些字段。
	inputHtmls.push(Html.input({name: "_fields", type: 'hidden', value: showFields.join(',')}));
	
	inputHtmls.push(Html.input({
		type: 'submit',
		class: 'btn btn-primary',
		value:'保存' 
	}));
	
	return Html.form(formProperties).html(inputHtmls);
	
}