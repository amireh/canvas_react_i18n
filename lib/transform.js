var _ = require('lodash');
var padArray = require('./util/pad_array');
var extractTextBlocks = require('./extract_text_blocks');
var wrap = require('./wrap');
var VERBOSE = process.env.VERBOSE;
var extend = _.extend;

var TRANSFORMED_TEXT = _.template(
  '<<%= tagName %> dangerouslySetInnerHTML={{ __html: <%= i18nDirective %> }} />'
);

var transform = function(input) {
  var textBlocks = extractTextBlocks(input, true);
  var padding = 0;
  var contents;

  if (textBlocks.length) {
    contents = input.split('');
    textBlocks.forEach(function(block, index) {
      var oldCharCount, newCharCount, charCountDelta;
      var offset = block.offset;
      var i, transformedDOM;

      var begin = padding + offset[0];
      var end   = padding + offset[1];
      var wrapped = wrap(block.defaultValue);

      block.defaultValue = wrapped.stringValue;
      block.stringValue = block
        .compile(wrapped.wrapper)
        // Support for interpolated variables wrapped inside {} for React/JSX
        // compatibility.
        //
        // @see https://github.com/amireh/canvas_react_i18n/issues/1
        // @since 04/11/2014
        .replace(/\{\\?['"]%\{([^\}]+)\}\\?['"]\}/g, '%{$1}');

      transformedDOM = TRANSFORMED_TEXT({
        tagName: block.tagName,
        i18nDirective: block.stringValue
      });

      if (VERBOSE) {
        console.log('Converted:', block);
      }

      oldCharCount = offset[1] - offset[0];
      newCharCount = transformedDOM.length;

      // Need to know how many characters we'll be adding, or popping, so that
      // we properly pad the offsets of the successive text transformations, if
      // any.
      charCountDelta = newCharCount - oldCharCount;

      // Clear the original <Text /> tag and its content:
      for (i = begin; i < end; ++i) {
        contents[i] = '';
      }

      if (charCountDelta > 0) {
        // we're pushing more chars than there originally was, must pad the buffer
        padding += charCountDelta;

        contents = padArray(contents, begin, charCountDelta);
      }

      // Write the new transformed content:
      for (i = begin; i < begin + newCharCount; ++i) {
        contents[i] = transformedDOM[i - begin];
      }
    });

    contents = contents.join('');
  }

  return contents || input;
};

module.exports = transform;
module.exports.configure = extractTextBlocks.configure;
