var subject = require('../lib/wrap');
var loadFixture = require('./helpers').loadFixture;

describe('#wrap', function() {
  it('should work', function() {
    var input = loadFixture('wrappers-2.in.html');
    var output = loadFixture('wrappers-2.out.html');
    var transformed = subject(input);

    expect(transformed.stringValue).toEqual(output);
    expect(transformed.wrapper['*']).toEqual('<p>$1</p>');
    expect(transformed.wrapper['**']).toEqual('<span>$1</span>');
    expect(transformed.wrapper['***']).toEqual('<span>$1</span>');
    expect(transformed.wrapper['****']).toEqual('<a href="http://google.com">$1</a>');
    expect(transformed.wrapper['*****']).toEqual('<iframe src="%{page_url}">$1</iframe>');
  });

  it('should work with a complicated DOM', function() {
    var input = loadFixture('wrappers.in.html');
    var output = loadFixture('wrappers.out.html');
    var transformed = subject(input);

    expect(transformed.stringValue).toEqual(output);
    expect(transformed.wrapper['*']).toEqual('<p>$1</p>');
    expect(transformed.wrapper['**']).toEqual('<p>$1</p>');
    expect(transformed.wrapper['***']).toEqual('<p>$1</p>');
    expect(transformed.wrapper['****']).toEqual('<a href="%{article_url}" target="_blank">$1</a>');
  });

  it('should work with nested tags', function() {
    var output;
    var input = [
      '<p>',
        '<span id="one">Hi',
          '<span id="two">%{name}</span>',
        '</span>',
      '</p>'
    ].join('\n');

    output = subject(input);
    expect(output.stringValue).toEqual([
      '*',
        '**Hi',
          '***%{name}***',
        '**',
      '*'
    ].join('\n'));

    expect(output.wrapper['*']).toEqual('<p>$1</p>');
    expect(output.wrapper['**']).toEqual('<span id="one">$1</span>');
    expect(output.wrapper['***']).toEqual('<span id="two">$1</span>');
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