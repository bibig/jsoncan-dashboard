exports.render = render;

var Html = require('htmler');
var ul = Html.ul;
var li = Html.li;
var a = Html.a;
var span = Html.span;

var beforePage = 3;
var afterPage = 3;

	
function render (currentPage, pageCount, link) {
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