var _ = require('lodash');
var padArray = require('./util/pad_array');
var extractTextBlocks = require('./extract_text_blocks');
var wrap = require('./wrap');
var VERBOSE = process.env.VERBOSE;
var extend = _.extend;

var TRANSFORMED_TEXT = _.template(
  '<div dangerouslySetInnerHTML={{ __html: <%= i18nDirective.replace(/;$/, "") %> }} />'
);

var transform = function(input) {
  var textBlocks = extractTextBlocks(input, true);
  var padding = 0;
  var contents;

  if (textBlocks.length) {
    contents = input.split('');
    textBlocks.forEach(function(block) {
      var oldCharCount, newCharCount, charCountDelta;
      var offset = block.offset;
      var i, transformedDOM;

      var begin = padding + offset[0];
      var end   = padding + offset[1];
      var wrapped = wrap(block.defaultValue);

      block.options = extend({}, block.options, {
        wrapper: wrapped.wrapper
      });

      block.defaultValue = wrapped.stringValue;
      block.stringValue = block.recompile();

      transformedDOM = TRANSFORMED_TEXT({
        i18nDirective: block.stringValue
      });

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
        // we're pushing more chars than there originally was
        padding += charCountDelta;

        contents = padArray(contents, begin, charCountDelta);
      }
      else {
        // we're popping some chars
        padding -= charCountDelta;
      }

      // Write the new transformed content:
      for (i = begin; i < begin + newCharCount; ++i) {
        contents[i] = transformedDOM[i - begin];
      }

      if (VERBOSE) { console.log('Padding: [%d]', padding); }
    });

    contents = contents.join('');
  }

  return contents || input;
};

module.exports = transform;