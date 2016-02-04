'use strict';

const Q    = require('bluebird');
const fs   = require('fs');
const path = require('path');
const _    = require('lodash');


function toFile(target, method, file) {
  var old = target[method];
  target[method] = function () {
    let dynamicFile = _.template(file)(_.first(arguments));
    if (fs.existsSync(dynamicFile)) {
      return Q.resolve(JSON.parse(fs.readFileSync(dynamicFile)));
    }
    return old.apply(target, arguments).then(function (data) {
      let dir = path.dirname(dynamicFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFileSync(dynamicFile, JSON.stringify(data));
      return data;
    });
  };
}

module.exports = {
  toFile: toFile
};
