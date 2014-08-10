var subject = require('../lib/transform');
var loadFixture = require('./helpers').loadFixture;

describe('#transform', function() {
  it('should work', function() {
    var input = loadFixture('transform.in.jsx');
    var output = loadFixture('transform.out.jsx');

    expect(subject(input)).toEqual(output);
  });

  xit('works with multiple <Text /> components', function() {
    var input = loadFixture('transform_multi.in.jsx');
    var output = loadFixture('transform_multi.out.jsx');

    expect(subject(input)).toEqual(output);
  });
});
