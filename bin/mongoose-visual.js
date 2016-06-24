#!/usr/bin/env node
'use strict';

var visual  = require('../lib/mongoose-visual');
var program = require('commander');
var pkg     = require('../package.json');

program
  .version(pkg.version)
  .option('-d, --docs', 'Generate docs')
  .option('-s, --server', 'Start server')
  .parse(process.argv);

if (program.docs) {
  visual.docs(program.docs[0]);
} else if (program.server) {
  visual.server();
} else {
  program.outputHelp();
}
