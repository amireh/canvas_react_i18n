module.exports = function padArray(original, offset, pad) {
  var padding = [];
  var i;

  for (i = 0; i < pad; ++i) {
    padding[i] = '';
  }

  return [].concat(
    original.slice(0, offset),  // before part
    padding,       // the padding
    original.slice(offset)      // the "after" part
  );
};