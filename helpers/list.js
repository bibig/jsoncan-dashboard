exports.render = render;
exports.renderPages = renderPages;
exports.renderAddLink = renderAddLink;

var Html = require('htmler');
var table = Html.table;
var thead = Html.thead;
var tbody = Html.tbody;
var tr = Html.tr;
var td = Html.td;
var th = Html.th;
var a = Html.a;
var span = Html.span;

function render(records, config) {
	var tableHeadHtml = '';
	var tableBodyHtml = '';
	var schemas = config.schemas;
	var scriptHtml = '';
  // console.log(config.showFields); 
	
	schemas.forEachField(function (name, field) {
		tableHeadHtml += th().html(field.text ? field.text : field.name);
	}, config.showFields);
	
	tableHeadHtml += th().html('操作');
	tableHeadHtml = tr().html(tableHeadHtml);
    
	records.forEach(function (record) {
		var trHtml = '';
		
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
		
		trHtml += td().html(
			a({href: config.links.edit(record._id)}).html('编辑'),
			span().html(' | '),
			a({href: '#', 'onclick': 'del(\'' + config.links.delete(record._id) + '\');'}).html('删除')
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

function renderPages (currentPage, pageCount, link) {
	var ul = Html.ul;
	var li = Html.li;
	
	var beforePage = 3;
	var afterPage = 3;
	var pages = [1];
	var pagesHtml = [];
	
	if (pageCount < 2 || currentPage > pageCount) return '';
	
	if (currentPage - beforePage > 2) {
		pages.push('...');
	}
	
	for (var i = currentPage - beforePage; i <= currentPage; i++) {
		if (i > 1) {
			pages.push(i);
		}
	}
	
	for (var i = currentPage + 1; i <= currentPage + afterPage; i++) {
		if (i < pageCount) {
			pages.push(i);
		}
	}
	
	if (pages.indexOf(pageCount) == -1) {
	
		if (currentPage + afterPage < pageCount - 1) {
			pages.push('...');
		}

		pages.push(pageCount);
	}
	
	pages.forEach(function (page) {
		if (page == '...') {
			pagesHtml.push(li("disabled").html(span().html('...')));
		} else if ( page == currentPage) {
			pagesHtml.push(li('active').html(a({href: '#'}).html(page)));
		} else {
			pagesHtml.push(li().html(a({href: link(page)}).html(page)));
		}
		
	});
	
	if (currentPage > 1) {
		pagesHtml.unshift(li().html(a({href: link(currentPage - 1)}).html('&laquo;')));
	} else {
		pagesHtml.unshift(li("disabled").html(span().html('&laquo;')));
	}
	
	if (currentPage < pageCount) {
		pagesHtml.push(li().html(a({href: link(currentPage + 1)}).html('&raquo;')));
	} else {
		pagesHtml.push(li("disabled").html(span().html('&raquo;')));
	}
	
	return ul("pagination").html(pagesHtml);
}

function renderAddLink (link, text) {
	return Html.a({class: 'btn btn-primary', href: link()}).html(text || '新增');
}