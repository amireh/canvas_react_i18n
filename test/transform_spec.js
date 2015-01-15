var subject = require('../lib/transform');
var loadFixture = require('./helpers').loadFixture;

describe('#transform', function() {
  it('should work', function() {
    var input = loadFixture('transform.in.jsx');
    var output = loadFixture('transform.out.jsx');

    expect(subject(input)).toEqual(output);
  });

  it('works with multiple <Text /> components', function() {
    var input = loadFixture('transform_multi.in.jsx');
    var output = loadFixture('transform_multi.out.jsx');

    expect(subject(input)).toEqual(output);
  });

  describe('tagName', function() {
    it('respects component-level overrides', function() {
      expect(subject("<Text tagName=\"foo\">Hello</Text>")).toMatch(/^<foo/);
    });

    it('respects config-level overrides', function() {
      var origTagName = subject.configure({}).tagName;
      subject.configure({tagName: "foo"});
      expect(subject("<Text>Hello</Text>")).toMatch(/^<foo/);
      subject.configure({tagName: origTagName});
    });
  });
});
