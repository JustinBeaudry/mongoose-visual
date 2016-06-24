'use strict';

var fs        = require('fs');
var util      = require('util');
var path      = require('path');
var _         = require('underscore');
var mongoose  = require('mongoose');
var express   = require('express');
var app       = express();

var projectModels = [];
var JSONOutput    = [];
var buildPath     = path.join(__dirname, '../build');
var publicPath    = path.join(__dirname, '../public');
var srcPath       = path.join(__dirname, '../visuals');
var HTML          = fs.readFileSync(path.join(srcPath, 'template.html')).toString();
var itemHTML      = fs.readFileSync(path.join(srcPath, 'item.html')).toString();
var content       = '';

var loadedModels = 0
var totalModels  = 0

module.exports = {
  docs: docs,
  server: server
};

/**
 *
 * @param model
 * @param githubLink
 */
function HTMLModel(model, githubLink) {
  content += _.template(itemHTML)({
    title: model.name,
    props: model.props,
    link: path.join(githubLink, model.name + '.js'),
    ref: model.ref
  });
}

/**
 *
 * @param name
 * @param model
 * @param githubLink
 */
function abstractModel(name, model, githubLink) {

  var props = [];

  Object.keys(model.paths).forEach(function(path) {
    var obj = model.paths[path];
    props.push({
      enums: obj.enumValues,
      name: obj.path,
      type: obj.instance,
      typeClass: (obj.instance ? obj.instance.toLowerCase() : 'other' ) + 'Type',
      indexed: obj._index || false,
      ref: obj.options.ref
    });
  });
  
  var mongooseModel = {
    name  : name,
    props : props
  };
  
  JSONOutput.push(mongooseModel);
  HTMLModel(mongooseModel, githubLink);
}

/**
 *
 * @param dir
 * @param githubLink
 */
function docs(dir, githubLink) {

  dir = path.resolve(dir);

  process.on('modelsLoaded', function() {

    var writeReady;
    try {
      writeReady = JSON.stringify(JSONOutput);
    } catch(e) {
      throw e;
    }


    if (!fs.existsSync(buildPath)) {
      fs.mkdirSync(buildPath);
    }

    fs.writeFileSync(path.join(buildPath, "models.json"),  writeReady);
    fs.writeFileSync(path.join(buildPath, "index.html"), _.template(HTML)({
      content: content
    }));
  });

  
  fs.readdir(dir, function(error, files) {
    if (error) {
      throw error;
    }

    totalModels = files.length;

    files.forEach(function(file) {
      if (path.extname(file) === 'js') {
        var modelName = file.replace('.js', '');
        var modelPath = path.join(dir, file);

        projectModels[modelName] = require(modelPath);
        loadedModels++;

        if (loadedModels === totalModels) {

          Object.keys(projectModels).forEach(function(model) {
            abstractModel(model, projectModels[model], githubLink);
          });

          process.emit('modelsLoaded', true);
        }
      }
    });
  });
}

/**
 *
 */
function server(port) {
  port = port || 8000;

  app.get('/', function(req, res) {
    var _HTML = fs.readFileSync(path.join(buildPath, 'index.html'));
    res.writeHead(200, {
      'Content-Type' : 'text/html'
    });
    res.end(_HTML);
  });

  app.get('/json', function(req, res) {
    var UTF8String = fs.readFileSync(path.join(buildPath, 'models.json'));
    var modelsJSON = JSON.parse(UTF8String);

    res.json(modelsJSON);
  });

  app.get('/style.css', function(req, res) {
    var _CSS = fs.readFileSync(path.join(publicPath, 'style.css'));
    res.writeHead(200, {
      'Content-Type' : 'text/css'
    });
    res.end(_CSS);
  });

  console.log('> mongoose visual listening on: http://localhost:%d/', port);
  app.listen(port);
}
