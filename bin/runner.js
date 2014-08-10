#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var scriptPath = path.join(__dirname, '..', 'main.js');
var convert = require(scriptPath);
var filePath = process.argv[2];
var fileContents;

if (!filePath) {
  console.error('Usage: canvas_i18n_processor ./path/to/file.js');
  process.exit(1);
}

fileContents = String(fs.readFileSync(filePath));
console.log(convert(fileContents));

