var _ = require('lodash');

var underscoreStr = function(str) {
  return str.replace(/([A-Z])/g, function($1){
    return '_' + $1.toLowerCase();
  });
};

// Locates a starting <Text ... > and closing </Text> tags:
var TEXT_TAG_START = /<Text[^>]+>/m;
var TEXT_TAG_END = '</Text>';

// Capture all attribute tags inside the opening <Text> tag. E.g:
//
//     <Text phrase="foo" name="Ahmad">...</Text>
//
// Yields a capture:
//
//     phrase="foo" name="Ahmad"
var TEXT_PROPS_EXTRACTOR = /<Text([^>]+)>/;

// Locates the leading <Text> and trailing </Text>:
var TEXT_TAG_STRIPPER = /^<Text[^>]+>|<\/Text>$/g;

var I18N_DIRECTIVE = _.template([
  '<%= func %>("<%= phrase %>", "<%= defaultValue %>", <%= options %>)'
].join(''));

var I18N_DIRECTIVE_WITH_WRAPPER = _.template([
  '(function(){',
    'var wrapper=<%=wrapper%>;',
    'return <%= func %>("<%= phrase %>", "<%= defaultValue %>", <%= options %>);',
  '}())'
].join(''));

var config = {
  func: 'I18n.t'
};

var PHRASE_PROP = 'phrase';

var normalizeStr = function(str) {
  return str.replace(/"/g, '\\"');//.replace(/\n+/g, ' ');
};

/**
 * Generate the options parameter to use in the I18n.t() directive.
 *
 * @param  {Object} options
 *         The tag attributes you extracted from the starting <Text> docstring.
 *
 * @note
 * This gets really trippy when we're passing values for interpolation in React.
 * For example, to pass a "name" option to the <Text /> component, you would do
 * something like this:
 *
 *     <Text name="Ahmad" /> // OR, much more likely:
 *     <Text name={this.props.name} />
 *
 * Because of the second form, this method will not produce valid JSON, e.g,
 * you can't "eval()" it unless you're inside the context in which the <Text />
 * definition was done because it needs access to {this.props.name} to
 * evaluate.
 *
 * @return {String}
 *         The objects in a serialized notation, can be eval()d or written to
 *         an I18n.t() directive string.
 */
var dumpOptions = function(options) {
  return JSON.stringify(options).replace(/\"\{|\}\"/g, '');
};

var compile = function(phrase, defaultValue, options, wrapper) {
  var directive;

  if (wrapper) {
    options.wrapper = "{wrapper}";
    directive = I18N_DIRECTIVE_WITH_WRAPPER;
  }
  else {
    directive = I18N_DIRECTIVE;
  }

  return directive({
    func: config.func,
    phrase: phrase,
    defaultValue: normalizeStr(defaultValue),
    options: dumpOptions(options),
    wrapper: wrapper ? dumpOptions(wrapper) : 'undefined'
  });
};

/**
 * Given a <Text>...</Text> component string, this method will extract several
 * i18n items and construct an I18n.t() directive that would work in Canvas.
 *
 * Note: you should not use this directly, use #extractTextBlocks() instead as
 * it takes care of extracting all blocks in a given source string.
 *
 * @param  {String} textBlock
 *         A string containing a *single* <Text>...</Text> React component.
 *
 * @return {Object} i18n
 *
 * @return {String} i18n.phrase
 *         The phrase you're translating; the "name" in `I18n.t("name")`.
 *
 * @return {String} i18n.defaultValue
 *         The text or HTML contents of the <Text> component. Beware that this
 *         is not ready for injecting into an I18n.t() call as it requires
 *         wrapping. See #wrap()
 *
 * @return {Object} i18n.options
 *         Any options passed to the <Text/> component will be referenced here,
 *         such as "context", "count", or any variables the phrase will be
 *         interpolating.
 *
 * @return {String} i18n.stringValue
 *         The full call to I18n.t() with the proper phrase, its default value,
 *         and any options. This can be `eval()`d inside a Canvas environment
 *         and it would yield the proper value.
 */
var extract = function(textBlock, dontCompile) {
  var getPhrase = function(params) {
    return params.filter(function(prop) {
      return prop.key === PHRASE_PROP;
    }).map(function(phraseProp) {
      return phraseProp.value;
    })[0];
  };

  var getParams = function(tag) {
    return tag
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(function(prop) {
        return prop.trim().replace(/"/g, '').split('=');
      })
      .map(function(fragments) {
        return {
          key: fragments[0].trim(),
          value: fragments[1].trim()
        };
      });
  };

  var i18n = {
    phrase: null,
    defaultValue: null,
    stringValue: '',
    options: {},
    compile: function(wrapper) {
      return compile(i18n.phrase, i18n.defaultValue, i18n.options, wrapper);
    }
  };

  var textTagStart = textBlock.match(TEXT_PROPS_EXTRACTOR)[1];
  var tagParams = getParams(textTagStart);
  var i18nPhrase = getPhrase(tagParams);
  var i18nParams = tagParams.filter(function(prop) {
    return prop.key !== PHRASE_PROP;
  }).reduce(function(set, entry) {
    set[underscoreStr(entry.key)] = entry.value;
    return set;
  }, {});

  i18n.phrase = i18nPhrase;
  i18n.options = i18nParams;
  i18n.defaultValue = textBlock
    .replace(TEXT_TAG_STRIPPER, '') // remove <Text ...> and </Text>
    .replace(/[\n\s]+/g, ' ')       // no newlines, use spaces instead
    .trim();

  // Generate the actual I18n.t() directive
  if (!dontCompile) {
    i18n.stringValue = i18n.compile();
  }

  if (process.env.VERBOSE) {
    console.log(i18n);
    console.log(i18n.stringValue);
  }

  return i18n;
};

var extractTextBlocks = function(content, dontCompile) {
  var block;
  var cursor = 1;
  var charsConsumed = 0;
  var output = [];
  var begin, end, textItem;

  content = String(content);

  while (cursor > -1) {
    cursor = content.search(TEXT_TAG_START);

    if (cursor > -1) {
      begin = cursor;
      end = content.indexOf(TEXT_TAG_END) + TEXT_TAG_END.length;
      block = content.substring(begin, end);

      textItem = extract(block, dontCompile);
      textItem.offset = [ charsConsumed + begin, charsConsumed + end ];

      output.push(textItem);
    } else {
      break;
    }

    content = content.substr(begin + block.length);
    charsConsumed += begin + block.length;
  }

  return output;
};

module.exports = extractTextBlocks;
module.exports.compile = compile;
module.exports.configure = function(options) {
  if (options.func) {
    config.func = options.func;
  }

  return config;
};