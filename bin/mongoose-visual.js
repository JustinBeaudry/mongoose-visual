#!/usr/bin/env node
'use strict';

var visual  = require('../lib/mongoose-visual');
var program = require('commander');
var pkg     = require('../package.json');

program
  .version(pkg.version)
  .option('-d, --docs [value]', 'Generate docs')
  .option('-g, --github [value]', 'Github link')
  .option('-s, --server', 'Start server')
  .option('-p, --port [value]', 'Server port')
  .parse(process.argv);

if (program.docs) {
  visual.docs(program.docs, program.github);
} else if (program.server) {
  visual.server(program.port);
} else {
  program.outputHelp();
}
