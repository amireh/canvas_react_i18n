var padArray = require('./util/pad_array');
var VERBOSE = process.env.VERBOSE;
var jsdom = require('jsdom').jsdom().parentWindow.document;

var isSignificantTextNode = function(node) {
  return node.nodeName === '#text' && node.nodeValue.trim();
};

var isHtmlNode = function(node) {
  return node.nodeName !== '#text';
};

var extractWrappers = function(html) {
  var wrappers = [];

  var extractWrapper = function(node, childrenOnly, wrapperNode) {
    wrapperNode = wrapperNode || node;

    var wrappedText = '';
    var nodes = [].slice.call(node.childNodes);
    var textNodes = nodes.filter(isSignificantTextNode);
    var htmlNodes = nodes.filter(isHtmlNode);

    // coalesce nested tags with no significant intermediate text into a
    // single wrapper
    if (!childrenOnly && !textNodes.length && htmlNodes.length === 1) {
      return extractWrapper(htmlNodes[0], false, wrapperNode);
    }

    nodes.forEach(function(node) {
      if (node.nodeName === '#text') {
        wrappedText += node.nodeValue;
      } else {
        wrappedText += extractWrapper(node);
      }
    });

    if (!childrenOnly) {
      node.innerHTML = "$1";
      wrapper = wrapperNode.outerHTML;
      var index = findOrAddWrapper(wrapper);
      wrappedText = wrap(wrappedText, index);
    }

    return wrappedText;
  };

  var findOrAddWrapper = function(wrapper) {
    var wrappersLen = wrappers.length;
    var i;
    for (i = 0; i < wrappersLen; i++) {
      if (wrappers[i] === wrapper)
        return i;
    };
    wrappers.push(wrapper);
    return i;
  };

  var asterisk = function(count) {
    return new Array(count + 2).join("*")
  };

  var wrap = function(text, index) {
    var delimiter = asterisk(index);
    return delimiter + text + delimiter;
  };

  var div = jsdom.createElement('div');
  div.innerHTML = html;

  var stringValue = extractWrapper(div, true);

  var result = {};
  wrappers.forEach(function(wrapper, i) {
    result[asterisk(i)] = wrapper;
  });

  return {
    stringValue: stringValue,
    wrapper: result
  };
};

module.exports = extractWrappers;
