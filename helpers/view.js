exports.render = render;

var Html = require('htmler');
var table = Html.table;
// var tbody = Html.tbody;
// var thead = Html.thead;
var tr = Html.tr;
var td = Html.td;
var th = Html.th;
var a = Html.a;
var span = Html.span;

function render (record, config) {
	var rows = [];
	var scriptHtml;
	var schemas = config.schemas;
	
	//console.log(config.showFields);
	schemas.forEachField(function (name, field) {
		var value = record[field.name];
		// console.log(name);	
		rows.push(tr().html(
			th().html(field.text || field.name),
			td().html(schemas.presentValue(name, value))
		));
	}, config.showFields);
	
	rows.push(
		tr().html(
			td().html(),
			td().html(
				a({href: config.links.edit, class: 'btn btn-warning'}).html('编辑'),
				span().html('&nbsp;'),
				a({href: '#', 'onclick': 'del(\'' + config.links.delete + '\');', class: 'btn btn-danger'}).html('删除'),
				span().html('&nbsp;'),
				a({href: config.links.add, class: 'btn btn-success'}).html('新增')
			)
		)
	);
	
	scriptHtml = Html.script().html(
		function del(url) {
			if (confirm('您确定要删除这条记录?')) {
				window.location = url;
			}
		}
	);

	return table('table table-bordered').html(rows) + scriptHtml;
}