var _ = require('lodash');
var CallHelpers = require('i18nliner/dist/lib/call_helpers')['default'];

var underscoreStr = function(str) {
  return str.replace(/([A-Z])/g, function($1){
    return '_' + $1.toLowerCase();
  });
};

// Locates a starting <Text ... > and closing </Text> tags:
var TEXT_TAG_START = /<Text[^>]*>/m;
var TEXT_TAG_END = '</Text>';

// DANGER: does not support curly-braces within the expression.
// Prefix check is important to ensure we don't mangle explicit
// i18n-style interpolation
var JS_EXPRESSION = /(^|[^%])(\{.*?\})/g;

// Capture all attribute tags inside the opening <Text> tag. E.g:
//
//     <Text key="foo" name="Ahmad">...</Text>
//
// Yields a capture:
//
//     key="foo" name="Ahmad"
var TEXT_PROPS_EXTRACTOR = /<Text([^>]*)>/;

// Locates the leading <Text> and trailing </Text>:
var TEXT_TAG_STRIPPER = /^<Text[^>]*>|<\/Text>$/g;

var I18N_DIRECTIVE = _.template([
  '<%= func %>("<%= key %>", "<%= defaultValue %>", <%= options %>)'
].join(''));

var I18N_DIRECTIVE_WITH_WRAPPER = _.template([
  '(function(){',
    'var wrapper=<%=wrapper%>;',
    'return <%= func %>("<%= key %>", "<%= defaultValue %>", <%= options %>);',
  '}())'
].join(''));

var config = {
  func: 'I18n.t'
};

var isKey = function(property) {
  var key = property.key;
  if (key === "key") return true;
  if (key !== "phrase") return false;
  console.warn("`phrase` is deprecated; use `key` instead, or just rely on inferred keys");
  return true;
};
var not = function(fn) {
  return function() {
    return !fn.apply(this, arguments);
  };
}

var normalizeStr = function(str) {
  return str.replace(/"/g, '\\"');//.replace(/\n+/g, ' ');
};

// DRY alert, this is borrowed/adapted from i18nliner-handlebars ...
// might make sense to move some of it up into i18nliner-js
var normalizeInterpolationKey = function(string) {
  return string.replace(/[^a-z0-9]/gi, ' ')
    .replace(/([A-Z\d]+|[a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .trim()
    .replace(/ +/g, '_')
    .substring(0, 32);
};

var inferInterpolationKey = function(string, options) {
  var key;
  var baseKey;
  var i;
  // remove some superfluous stuff that doesn't add value to the key
  key = string.replace(/this\.(props|state)\./g, '');
  key = normalizeInterpolationKey(key);
  baseKey = key;
  // make sure the key is unique in case a slightly different string
  // results in the same value
  while (options[key] && options[key] !== baseKey) {
    key = baseKey + '_' + i;
    i++;
  }
  return key;
};

/**
 * Change any javascript expressions into I18n placeholders, whether they
 * apppear in the main string or a future inferred wrapper (i18nliner
 * handles both types correctly)
 */
var extractPlaceholders = function(string, options) {
  return string.replace(JS_EXPRESSION, function(match, prefix, expression) {
    var key = inferInterpolationKey(expression, options);
    options[key] = expression; // expression includes the {}, for dumpOptions

    // if the prefix is a "=", assume we are using this as an attribute,
    // and quote it accordingly (since it won't be handled by react)...
    // i18nliner will handle html-safety, but we need to quote so we don't
    // end the attribute prematurely due to whitespace
    // TODO: make this more robust
    return (prefix === '=') ?
      prefix + '"%{' + key + '}"' :
      prefix + '%{' + key + '}';
  });
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

var compile = function(key, defaultValue, options, wrapper) {
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
    key: key,
    defaultValue: normalizeStr(defaultValue),
    options: dumpOptions(options),
    wrapper: wrapper ? dumpOptions(wrapper) : 'undefined'
  });
};

/**
 * Given a <Text>...</Text> component string, this method will extract several
 * i18n items and construct an I18n.t() directive that would work with i18nliner.
 *
 * Note: you should not use this directly, use #extractTextBlocks() instead as
 * it takes care of extracting all blocks in a given source string.
 *
 * @param  {String} textBlock
 *         A string containing a *single* <Text>...</Text> React component.
 *
 * @return {Object} i18n
 *q
 * @return {String} i18n.key
 *         The key you're translating; the "name" in `I18n.t("name")`.
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
 *         The full call to I18n.t() with the proper key, its default value,
 *         and any options. This can be `eval()`d in an i18nliner-enabled app
 *         and it would yield the proper value.
 */
var extract = function(textBlock, dontCompile) {
  var getKey = function(params) {
    return params.filter(isKey).map(function(keyProp) {
      return keyProp.value;
    })[0];
  };

  var getParams = function(tag) {
    tag = tag
      .replace(/\s+/g, ' ')
      .trim();
    if (!tag) {
      return [];
    }

    return tag
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
    key: null,
    defaultValue: null,
    stringValue: '',
    options: {},
    compile: function(wrapper) {
      return compile(i18n.key, i18n.defaultValue, i18n.options, wrapper);
    }
  };

  var textTagStart = textBlock.match(TEXT_PROPS_EXTRACTOR)[1];
  var tagParams = getParams(textTagStart);
  var i18nKey = getKey(tagParams);
  var i18nParams = tagParams.filter(not(isKey)).reduce(function(set, entry) {
    set[underscoreStr(entry.key)] = entry.value;
    return set;
  }, {});

  i18n.options = i18nParams;
  i18n.defaultValue = textBlock
    .replace(TEXT_TAG_STRIPPER, '') // remove <Text ...> and </Text>
    .replace(/[\n\s]+/g, ' ')       // no newlines, use spaces instead
    .trim();
  i18n.defaultValue = extractPlaceholders(i18n.defaultValue, i18n.options);
  i18n.key = i18nKey || CallHelpers.inferKey(i18n.defaultValue);

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
