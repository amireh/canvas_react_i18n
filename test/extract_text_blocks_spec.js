var subject = require('../lib/extract_text_blocks');
var path = require('path');
var loadFixture = require('./helpers').loadFixture;

describe('#extractTextBlocks', function() {
  it('should extract the key', function() {
    var output = subject('<Text key="foo.bar"></Text>')[0];
    expect(output.key).toEqual('foo.bar');
  });

  it('should warn on phrase usage', function() {
    spyOn(console, 'warn');
    var output = subject('<Text phrase="foo.bar"></Text>')[0];
    expect(output.key).toEqual('foo.bar');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should infer a key if none is provided', function() {
    var output = subject('<Text>Hello World</Text>')[0];
    expect(output.key).toEqual('hello_world_e2033670');
  });

  it('should extract parameters', function() {
    var output = subject('<Text key="bar" articleUrl="http://www.google.com"></Text>')[0];

    expect(output.options).toEqual({
      article_url: 'http://www.google.com'
    });
  });

  it('should leave {parameters} untouched', function() {
    var output = subject('<Text key="foo.bar" articleUrl={url}></Text>')[0];

    expect(output.options).toEqual({
      article_url: '{url}'
    });
  });

  describe('#stringValue', function() {
    it('should produce an I18n.t() call string', function() {
      var output = subject('<Text key="foo.bar" articleUrl={url}></Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("foo.bar", "", {"article_url":url})');
    });

    it('should include de-interpolated strings', function() {
      var output = subject('<Text key="foo.bar" articleUrl={url}>Click <a href="%{article_url}">here</a>.</Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("foo.bar", "Click <a href=\\"%{article_url}\\">here</a>.", {"article_url":url})');
    });

    it('should infer sensible placeholders from expressions', function() {
      var output = subject('<Text key="foo.bar">Hello {this.props.user.name}</Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("foo.bar", "Hello %{user_name}", {"user_name":this.props.user.name})');
    });

    it('should infer quoted placeholders from expressions in markup attributes', function() {
      var output = subject('<Text key="foo.bar">Click <a href={title}>here</a></Text>')[0];

      expect(output.stringValue).toEqual('I18n.t("foo.bar", "Click <a href=\\"%{title}\\">here</a>", {"title":title})');
    });
  });

  it('should work with multiple blocks', function() {
    var output = subject([
      'render: function() {',
        'return (',
          '<div>',
            '<Text key="foo.x">X goes here.</Text>',
            '<Text key="foo.y">Y goes there.</Text>',
          '</div>',
        ');',
      '}'
    ].join("\n"));

    expect(output.length).toBe(2);

    expect(output[0].key).toBe('foo.x');
    expect(output[0].defaultValue).toBe('X goes here.');
    expect(output[0].offset).toEqual([ 36, 73 ]);

    expect(output[1].key).toBe('foo.y');
    expect(output[1].defaultValue).toBe('Y goes there.');
    expect(output[1].offset).toEqual([ 74, 112 ]);
  });

  describe('#compile', function() {
    it('should return a newly-compiled I18n.t() directive', function() {
      var output = subject('<Text key="foo.bar" articleUrl={url}></Text>')[0];

      output.key = 'foo';
      output.options = { name: 'Ahmad' };
      expect(output.compile()).toEqual('I18n.t("foo", "", {"name":"Ahmad"})');
    });
  });
});
