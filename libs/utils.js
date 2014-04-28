exports.filter = filter;
exports.merge = merge;
exports.mergeArray = mergeArray;
exports.clone = clone;
exports.cloneArray = cloneArray;
exports.hasKeys = hasKeys;
exports.fileExt = fileExt;
exports.humanFileSize = humanFileSize;
exports.trim = trim;

function merge (targetObj, defaultObj) {
	if (! targetObj) targetObj = {};
	if (! defaultObj) { return targetObj; }
	
 	Object.keys(defaultObj).forEach(function (key) {
		if (targetObj[key] == undefined) {
			targetObj[key] = defaultObj[key];
		}
	});
	return targetObj;						 
}

function filter (target, keys) {
  var safe = {};
  
  keys.forEach(function (key) {
    if (target[key] !== undefined && target[key] !== null && target[key] !== '') {
      safe[key] = target[key];
    }
  });
  
  return safe;
}

function cloneArray (target) {
  var copycat = [];
  target.forEach(function (ele) {
    if (Array.isArray(ele)) {
      copycat.push(cloneArray(ele));
    } else if (typeof ele == 'object') {
      copycat.push(clone(ele));
    } else {
      copycat.push(ele);
    }
  });
  return copycat;
}

function clone (target, keys) {
	var copycat;
	
	if (Array.isArray(target)) {
    return cloneArray(target);
  } else if (typeof target === 'object') {
    copycat = {};
    keys = keys || Object.keys(target);
    if ( keys.length > 0 ) {
      keys.forEach(function (key) {
        copycat[key] = clone(target[key]);
      });
    }
    return copycat;
  } else {
    return target;
  }
}

function mergeArray (a, b) {
  var c = [].concat(a);
  
  b.forEach(function (key) {
    if (c.indexOf(key) == -1) {
      c.push(key);
    }
  });
  
  return c;
}

function hasKeys (obj) {
  return Object.keys(obj).length > 0;
}

function fileExt (filename) {
	var info = filename.split('.');
	return info[info.length - 1];
}

function humanFileSize (size) {
	if (size < 1048576) { // 1m
		return parseInt(size * 10 / 1024) / 10  + 'k';
	} else {
		return parseInt(size * 10 / 1048576 ) / 10  + 'm';
	}
}

function trim (v) {
  if ( typeof v == 'string') {
      return v.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  } else {
      return v;
  }
}