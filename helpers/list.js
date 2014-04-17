exports.renderTable = renderTable;
exports.renderTitle = renderTitle;
exports.renderUl = renderUl;
exports.renderAddLink = renderAddLink;

var Html = require('htmler');
var table = Html.table;
var thead = Html.thead;
var tbody = Html.tbody;
var tr = Html.tr;
var td = Html.td;
var th = Html.th;
var a = Html.a;
var ul = Html.ul;
var li = Html.li;
var span = Html.span;

/**
 * needed args:
 *  schemas
 *  showFields
 *  links (link makers)
 *  readonly
 */
function renderTable (records, config) {
	var tableHeadHtml = '';
	var tableBodyHtml = '';
	var schemas = config.schemas;
	var scriptHtml = '';
	
	schemas.forEachField(function (name, field) {
		tableHeadHtml += th().html(field.text ? field.text : field.name);
	}, config.showFields);
	
	if (!config.readonly) {
  	tableHeadHtml += th().html('操作');
  }
	tableHeadHtml = tr().html(tableHeadHtml);
    
	records.forEach(function (record) {
		var trHtml = '';
		var editLink = '', deleteLink = '';
		
		schemas.forEachField(function (name, field) {
			var ele = '';
			var value = record[field.name];
			
			if (field.name == config.viewLinkField) {
				ele = a({href: config.links.view(record._id)}).html(value);
			} else {
				ele = schemas.presentValue(name, value);
			}
			trHtml += td().html(ele);
		
		}, config.showFields);

		if (!config.readonly) {
      editLink = config.links.edit ? a({href: config.links.edit(record._id)}).html('编辑') : '';
      deleteLink = config.links.delete ? a({href: '#', 'onclick': 'del(\'' + config.links.delete(record._id) + '\');'}).html('删除') : '';
    }
    
		trHtml += td().html(
			editLink,
			span().html('&nbsp;'),
			deleteLink
		);
		
		tableBodyHtml += tr().html(trHtml);
	});
  
	scriptHtml = Html.script().html(
		function del(url) {
			if (confirm('您确定要删除这条记录?')) {
				window.location = url;
			}
		}
	);

	return table('table table-striped').html(
		thead().html(tableHeadHtml),
		tbody().html(tableBodyHtml)
	) + scriptHtml;
}

function renderUl (records, config) {
  var liHtmls = [];
  records.forEach(function (record ) {
    var name = config.schemas.getRealName(config.viewLinkField);
    var value = record[name];

    liHtmls.push(
      li().html(
        a({href: config.links.view(record._id)}).html(config.schemas.presentValue(config.viewLinkField, value))
      )
    );
  });
  return ul('list-unstyled').html(liHtmls);
}

function renderTitle (title, addLinkUrl, addLinkText) {
  var addLink = '';
  if (addLinkUrl) {
    addLinkText = addLinkText || '新增';
    addLink = a({class: 'pull-right btn btn-large btn-success', href: addLinkUrl}).html(addLinkText);
  }
  
  return Html.h1().html(
      title, 
      addLink
  );
}

function renderAddLink (link, text) {
	return Html.a({class: 'btn btn-primary', href: link()}).html(text || '新增');
}