
exports.render = render;

var inputs = require('./inputs');
var grids  = require('./grids');
var Html   = require('htmler');
var path   = require('path');
var yi     = require('yi');

/**
 * [render description]
 * ...
 * @author bibig@me.com
 * @update [2014-05-03 17:31:50]
 * @param  {string} tableName
 * @param  {object} config
 * @return {string}
 */
function render (tableName, config) {
  var showFields     = config.showFields;
  var schemas        = config.schemas;
  var data           = config.data || {};
  var errors         = config.errors || {};
  var scriptHtmls;
  var inputHtmls     = '';
  var extraHtmls     = '';
  var inputFields    = {};
  var richTexts      = []; //tinymcr fields, dom id
  var formLayout     = config.formLayout || showFields;
  var submitName     = '__submit';
  var formProperties = {
    id: 'jdb-form',
    role: 'form',
    method: 'post',
    action: config.action
  };
  
  
  if (schemas.hasUploadField()) {
    formProperties.enctype = "multipart/form-data";
  }
  
  schemas.forEachField(function (name, field) {
    var args, value = data[name];

    if (undefined === value && undefined !== field.default) {
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
      default: // 'text'
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
    var cols = [];

    if (Array.isArray(row)) {
      row.forEach(function (name) {
        var multi = name.split(',');
        var multiItems = '';
        if (multi.length > 1) {
          multi.forEach(function (name) {
            multiItems += inputFields[yi.trim(name)];
          });
          fields.push(multiItems);
        } else {
          fields.push(inputFields[name]);
        }
      });
      inputHtmls += grids.renderColsByAverage(fields);
    } else if ( typeof row == 'object') {
      Object.keys(row).forEach(function (name) {
        fields.push(inputFields[name]);
        cols.push(row[name]);
      });
      inputHtmls += grids.renderCols(fields, cols);
    } else { 
      inputHtmls += inputFields[row];
    }
  });
  
  if (inputHtmls.indexOf('type="submit"') == -1) {
    inputHtmls += inputFields[submitName];
  }

  if (config.token) {
    extraHtmls += Html.input({name: "_csrf", type: 'hidden', value: config.token});
  }
  
  scriptHtmls = Html.script().html('$(function () { jd.onlySubmitOnce("jdb-form", "jdb-submit"); });');
  
  if (richTexts.length > 0) {
    scriptHtmls += Html.script().html('$(function () { jd.richText("' + richTexts.join(',') + '", "' + path.join(config.mount, config.staticRoot) + '") });');
  }
  
  return Html.form(formProperties).html(inputHtmls, extraHtmls) + scriptHtmls;
}