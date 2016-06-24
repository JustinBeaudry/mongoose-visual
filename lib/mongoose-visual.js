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
var HTML          = fs.readFileSync(path.join(__dirname, '../visuals/template.html')).toString();
var content       = '';

var loadedModels = 0
var totalModels  = 0;

module.exports = {
  docs: docs,
  server: server
};

/**
 *
 * @param model
 * @constructor
 */
function HTMLModel(model) {


  content += '<div class="grid-item">'
  content += '<div class="modelTitle"><code>' + model.name + '</code></div>';
  content += '<div class="models">';
  content += '<div id="' + model.name + '">';

  Object.keys(model.props).forEach(function(prop) {
    
    var name = model.props[prop].name;
    var type = model.props[prop].type;

    var propClass = (type ? type.toLowerCase() : 'other' ) + 'Type';

    if (name !== 'id' && name !== '_id') {
      content += '<div class="property">';
      content += '<div><code>' + name + ' <span class="propType ' + propClass + '">{' + (type || 'Other') + '}</span></code></div>';
      content += '</div>';
    }
  });
  content += '</div></div></div>';

}

/**
 *
 * @param name
 * @param model
 */
function abstractModel(name, model) {

  var props = [];

  Object.keys(model.paths).forEach(function(path) {
    var obj = model.paths[path];
    props.push({
      enums: obj.enumValues,
      name: obj.path,
      type: obj.instance,
      indexed: obj.options.index || false
    });
  });
  
  var mongooseModel = {
    name  : name,
    props : props
  };
  
  JSONOutput.push(mongooseModel);
  HTMLModel(mongooseModel);
}

/**
 *
 * @param dir
 */
function docs(dir) {

  process.on('modelsLoaded', function() {

    var writeReady;
    try {
      writeReady = JSON.stringify(JSONOutput);
    } catch(e) {
      throw e;
    }

    fs.writeFileSync(path.join(__dirname, "../visuals/models.json"),  writeReady);
    fs.writeFileSync(path.join(__dirname, "../visuals/models.html"), _.template(HTML)({
      content: content
    }));
  });

  fs.readdir(path.join(process.cwd(),  dir), function(error, files) {
    if (error) {
      throw error;
    }

    totalModels = files.length;

    files.forEach(function(file) {

      var modelName = file.replace('.js', '');
      var modelPath = path.join(process.cwd(), dir, file);

      projectModels[modelName] = require(modelPath);
      loadedModels++;

      if (loadedModels === totalModels) {

        Object.keys(projectModels).forEach(function(model) {
          abstractModel(model, projectModels[model]);
        });

        process.emit('modelsLoaded', true);
      }
    });
  });
}

/**
 *
 */
function server() {
  app.get('/', function(request, response) {
    var servingType = 'HTML';
    if (servingType === 'JSON') {

      var UTF8String = fs.readFileSync(__dirname + '/../visuals/models.json');
      var modelsJSON = JSON.parse(UTF8String);

      response.json(modelsJSON);
    } else if (servingType === 'HTML') {

      var HTML = fs.readFileSync(__dirname + '/../visuals/models.html');

      response.writeHead(200, { 'Content-Type' : 'text/html' });
      response.end(HTML);
    }
  });

  app.get('/style.css', function(request, response) {
    var CSS = fs.readFileSync(__dirname + '/../visuals/style.css', 'utf8');

    response.writeHead(200, { 'Content-Type' : 'text/css' });
    response.end(CSS);
  });

  app.listen(8000);
  console.log('> mongoose visual listening on: http://localhost:8000/');
}
