exports.text = text;
exports.select = select;
exports.textarea = textarea;
exports.file = file;
exports.checkbox = checkbox;
exports.radio = radio;

var Html = require('htmler');
var div = Html.div;
var label = Html.label;
var input = Html.input;
var span = Html.span;

function getInputId (fieldName) {
	return 'input_' + fieldName;
}

function getInputName (tableName, fieldName) {
	return tableName + '[' + fieldName + ']';
}

function getContainerClass (error) {
	var klass = ['form-group'];
	if (error) {
		klass.push('has-error');
		klass.push('has-feedback');
	}
	return klass;
}

function getLableHtml (schema) {
	return label({for: getInputId(schema.name)}).html(schema.text, schema.required ? '*' : '');
}
	
function getErrorHtml (error) {
	if (error) {
		return span('glyphicon glyphicon-remove form-control-feedback').html() + getHelpBlockHtml(error);
	}
	
	return '';
}
	
function getErrorBlockHtml (error) {
	if (error) {
		return getHelpBlockHtml(error);
	}
	return '';
}

function getHelpBlockHtml (text) {
	return span('help-block').html(text);
}

function getDefaultValue(value, schemas) {
	
	if (typeof value === 'undefined' || value === null || value === '') {
		if (typeof schemas.default != 'undefined') {
			return schemas.default;
		}
	}

	return value;
}

function text (tableName, schema, value, error) {
	var inputProperties = {
		type: 'text',
		name: getInputName(tableName, schema.name),
		id: getInputId(schema.name),
		class: 'form-control',
		placeholder: schema.text,
		value: getDefaultValue(value, schema)
	};
	var inputHtml = input(inputProperties);
	
	if (schema.unit) {
		inputHtml = div('input-group').html(
			inputHtml,
			span('input-group-addon').html(schema.unit)
		);
	}
	
	return div(getContainerClass(error)).html(
		getLableHtml(schema),
		inputHtml,
		getErrorHtml(error)
	);
}

function file (schema, error) {
	var inputProperties = {
		type: 'file',
		name: schema.name,
		id: getInputId(schema.name),
		class: 'form-control'
	};
	var inputHtml = input(inputProperties);
	
	if (schema.unit) {
		inputHtml = div('input-group').html(
			inputHtml,
			span('input-group-addon').html(schema.unit)
		);
	}
	
	return div(getContainerClass(error)).html(
		getLableHtml(schema),
		inputHtml,
		getErrorHtml(error)
	);
}

function select (tableName, schema, value, error) {
	var select = Html.select;
	var option = Html.option;
	var selectProperties = {
		class: 'form-control',
		id: getInputId(schema.name),
		name: getInputName(tableName, schema.name)
	};
	
	var options = [option({value: ''}).html('请选择')];
	var values = Object.keys(schema.values);
	var scriptHtml = '';
	
	values.forEach(function (value) {
		options.push(option({value: value}).html(getValuesDesc(schema, value)));
	});
	
	value = getDefaultValue(value, schema);
	
	if (value != null && value != '' && value != undefined) {
		scriptHtml = Html.script().html(
			"$(function () { $('#" + selectProperties.id + "').val('" + value + "');});"
		);
	}
	
	return div(getContainerClass(error)).html(
		getLableHtml(schema),
		select(selectProperties).html(options),
		getErrorBlockHtml(error)
	) + scriptHtml;
	
}

function textarea (tableName, schema, value, error) {
	var textarea = Html.textarea;
	var properties = {
		class: 'form-control',
		id: getInputId(schema.name),
		name: getInputName(tableName, schema.name),
		rows: schema.rows || 15
	};
	
	value = getDefaultValue(value, schema);
	
	return div(getContainerClass(error)).html(
		getLableHtml(schema),
		textarea(properties).html(value || ''),
		getErrorBlockHtml(error)
	);
}

function checkbox (tableName, schema, value, error) {
	// console.log(arguments);
	var properties = {
		type: 'checkbox',
		name: getInputName(tableName, schema.name)
	};
	value = getDefaultValue(value, schema);
	
	if (value) {
		properties['checked'] = 'checked';
	}
	
	// console.log(properties);
	
	return div('checkbox').html(
		label().html(
			input(properties),
			schema.text,
			getErrorBlockHtml(error)
		)
	);
}

function radioOption (name, value, text, checked) {
	var properties = {
		type: 'radio',
		name: name,
		value: value
	};
	if (checked) {
		properties['checked'] = 'checked';
	}
	
	return div('radio').html(
			label().html(input(properties), text)
	);
}

function radio (tableName, schema, value, error) {
	var name = getInputName(tableName, schema.name);
	var optionValues = Object.keys(schema.values);
	var optionsHtml = '';
	
	optionValues.forEach(function (optionValue) {
		optionsHtml += radioOption(name, optionValue, getValuesDesc(schema, optionValue), value == optionValue);
	});
	
	return div(getContainerClass(error)).html(
		getLableHtml(schema),
		// getLableHtml(schema),
		optionsHtml, 
		getErrorBlockHtml(error)
	);
}

function getValuesDesc (schema, value) {
	// console.log(arguments);
	var desc = schema.values[value];
	// console.log(desc);
	if (typeof desc == 'object') {
		if ( typeof schema.present == 'string') {
			return desc[schema.present];
		} else if ( typeof schema.present == 'function' ) {
			return schema.present(desc);
		} else {
			return desc.name || desc.title || desc.description || null;
		}
	} else {
		return desc;
	}
}
