module.exports = function padArray(original, offset, pad) {
  return [].concat(
    original.slice(0, offset),  // before part
    Array(pad).join(' '),       // the padding
    original.slice(offset)      // the "after" part
  );
};