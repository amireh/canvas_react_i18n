var subject = require('../../lib/util/pad_array');

describe('util.padArray', function() {
  it('should work', function() {
    var str = 'foobar';
    var arr = str.split('');

    expect(subject(arr, 3, 2)).toEqual(['f','o','o','','','b','a','r']);
  });
});