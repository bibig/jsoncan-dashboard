exports.render = render;

var Html = require('htmler');

function render (s) {

  switch (s) {
    case '+':
      s = 'plus';
      break; 
    case '*':
      s = 'fa-asterisk';
      break;
    case '@':
      s = 'envelope';
      break;
  }
  
  if (s.indexOf('fa-') === 0) {
    return Html.i('fa ' + s).html();
  } else {
    return Html.span('glyphicon glyphicon-' + s).html();
  }

}