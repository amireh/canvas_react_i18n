var padArray = require('./util/pad_array');
var VERBOSE = process.env.VERBOSE;

var extractWrappers = function(html) {
  var wrapper = {};
  var stringValue = '';

  var TAG_NAME = "[a-z][a-z0-9]*";
  var TAG_START = new RegExp('<(' + TAG_NAME + ')[^>]*(?!/)>', 'i');
  var tagStack = [];
  var charsConsumed = 0;

  var wrapTag = function(tag, input, allWrappers) {
    if (!tag) {
      return input;
    }

    allWrappers = allWrappers || {};

    var tagEndPosition = input.indexOf(tag.closingStr, tag.index);
    var chars;
    var wrapper, i, repl;
    var begin;
    var end;
    var charCountDelta;
    var tagContent;
    var asterisks;

    if (tagEndPosition > -1) {
      begin = tag.index;
      end = tagEndPosition + tag.closingStr.length;
      tagContent = input.substring(begin + tag.tag.length, tagEndPosition);
      asterisks = Array(tagStack.length + 2).join('*');

      // Create the starting * wrapper:
      wrapper = asterisks;

      // Keep the content of the tag:
      wrapper += tagContent;

      // Create the closing * wrapper:
      wrapper += asterisks;

      charCountDelta = wrapper.length - (end - begin);
      chars = input.split('');

      if (VERBOSE) {
        console.log('Handling tag <%s> at [%d, %d] (%s)',
          tag.tagName,
          begin,
          end,
          input.substring(begin, end));
      }

      if (charCountDelta > 0) {
        chars = padArray(chars, end, charCountDelta);
        end = end + charCountDelta;
      }

      for (i = begin, repl = 0; i < end; ++i, ++repl) {
        chars[i] = wrapper[repl] || '';
      }

      allWrappers[asterisks] = tag.openingStr + '$1' + tag.closingStr;
      input = chars.join('');
    } else {
      console.warn('Closing tag for <%s> at [%d] could not be located.',
        tag.tagName, tag.index);
    }

    return wrapTag(tagStack.pop(), input, allWrappers);
  };

  var extractTag = function(str) {
    var cursor, charCount;
    var match = str.match(TAG_START);

    if (!match) {
      return;
    }

    cursor = match.index;
    charCount = match[0].length;

    tagStack.push({
      tag: match[0],
      openingStr: match[0],
      closingStr: '</' + match[1] + '>',
      tagName: match[1],
      index: charsConsumed + cursor
    });

    charsConsumed += cursor + charCount;

    return extractTag(str.substring(cursor + charCount));
  };

  extractTag(html);
  stringValue = wrapTag(tagStack.pop(), html, wrapper);

  return {
    stringValue: stringValue,
    wrapper: wrapper
  };
};

module.exports = extractWrappers;