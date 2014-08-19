var subject = require('../lib/extract_text_blocks');
var path = require('path');
var loadFixture = require('./helpers').loadFixture;

describe('#extractTextBlocks', function() {
  it('should extract the path, scope, and phrase', function() {
    var output = subject('<Text scope="foo.bar"></Text>')[0];
    expect(output.path).toEqual('foo.bar');
    expect(output.scope).toEqual('foo');
    expect(output.phrase).toEqual('bar');
  });

  it('should extract parameters', function() {
    var output = subject('<Text scope="foo.bar" articleUrl="http://www.google.com"></Text>')[0];

    expect(output.options).toEqual({
      article_url: 'http://www.google.com'
    });
  });

  it('should leave {parameters} untouched', function() {
    var output = subject('<Text scope="foo.bar" articleUrl={url}></Text>')[0];

    expect(output.options).toEqual({
      article_url: '{url}'
    });
  });

  describe('#stringValue', function() {
    it('should produce an I18n.t() call string', function() {
      var output = subject('<Text scope="foo.bar" articleUrl={url}></Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("bar", "", {"article_url":url})');
    });

    it('should include de-interpolated strings', function() {
      var output = subject('<Text scope="foo.bar" articleUrl={url}>Click <a href="%{article_url}">here</a>.</Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("bar", "Click <a href=\\\"%{article_url}\\\">here</a>.", {"article_url":url})');
    });
  });

  it('should work with multiple blocks', function() {
    var output = subject([
      'render: function() {',
        'return (',
          '<div>',
            '<Text scope="foo.x">X goes here.</Text>',
            '<Text scope="foo.y">Y goes there.</Text>',
          '</div>',
        ');',
      '}'
    ].join("\n"));

    expect(output.length).toBe(2);

    expect(output[0].path).toBe('foo.x');
    expect(output[0].defaultValue).toBe('X goes here.');
    expect(output[0].offset).toEqual([ 36, 36 + 39 ]);

    expect(output[1].path).toBe('foo.y');
    expect(output[1].defaultValue).toBe('Y goes there.');
    expect(output[1].offset).toEqual([ 76, 76 + 40 ]);
  });

  describe('#compile', function() {
    it('should return a newly-compiled I18n.t() directive', function() {
      var output = subject('<Text scope="foo.bar" articleUrl={url}></Text>')[0];

      output.phrase = 'foo';
      output.options = { name: 'Ahmad' };
      expect(output.compile()).toEqual('I18n.t("foo", "", {"name":"Ahmad"})');
    });
  });
});