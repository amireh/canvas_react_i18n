var subject = require('../lib/wrap');
var loadFixture = require('./helpers').loadFixture;

describe('#wrap', function() {
  it('should work', function() {
    var input = loadFixture('wrappers-2.in.html');
    var output = loadFixture('wrappers-2.out.html');
    var transformed = subject(input);

    expect(transformed.stringValue).toEqual(output);
    expect(transformed.wrapper['*']).toEqual('<span>$1</span>');
    expect(transformed.wrapper['**']).toEqual('<a href="http://google.com">$1</a>');
    expect(transformed.wrapper['***']).toEqual('<iframe src="%{page_url}">$1</iframe>');
    expect(transformed.wrapper['****']).toEqual('<p>$1</p>');
  });

  it('should work with a complicated DOM', function() {
    var input = loadFixture('wrappers.in.html');
    var output = loadFixture('wrappers.out.html');
    var transformed = subject(input);

    expect(transformed.stringValue).toEqual(output);
    expect(transformed.wrapper['*']).toEqual('<p>$1</p>');
    expect(transformed.wrapper['**']).toEqual('<a href="%{article_url}" target="_blank">$1</a>');
  });

  it('should work with nested tags', function() {
    var output;
    var input = [
      '<p>',
        '<span id="one">Hi',
          '<span id="two">%{name}</span>',
        '</span>',
      '</p>',
      '<div>',
        '<p>',
          '<span>',
            '<em>Hello again <span id="two">%{name}</span></em>',
          '</span>',
        '</p>',
      '</div>',
      '<p>No nesting here</p>'
    ].join('\n');

    output = subject(input);
    expect(output.stringValue).toEqual([
      '**Hi',
        '*%{name}*',
      '**',
      '***Hello again *%{name}****',
      '****No nesting here****'
    ].join('\n'));

    expect(output.wrapper['*']).toEqual('<span id="two">$1</span>');
    expect(output.wrapper['**']).toEqual('<p>\n<span id="one">$1</span>\n</p>');
    expect(output.wrapper['***']).toEqual('<div>\n<p>\n<span>\n<em>$1</em>\n</span>\n</p>\n</div>');
    expect(output.wrapper['****']).toEqual('<p>$1</p>');
  });

  it('should keep the tag attributes', function() {
    var output;
    var input = [
      '<a href="http://google.com">Click me</a>'
    ].join('\n');

    output = subject(input);
    expect(output.wrapper['*']).toEqual('<a href="http://google.com">$1</a>');
  });
});
