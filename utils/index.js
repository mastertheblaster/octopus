'use strict';

const _ = require('lodash');


module.exports = {
  filter: function (query) {
    return function (values) {
      return query ? values.filter(function (value) {
        return _.includes(JSON.stringify(value).toLowerCase(), query.toLowerCase());
      }) : values;
    };
  },
  printError: function (error) {
    console.error(error);
  },
  printJson: function (value) {
    console.log(JSON.stringify(value, null, 2));
    return value;
  },
  validatePackage: function (value) {
    var properties = ['scripts', 'scripts.build', 'scripts.release', 'scripts.test', 'scripts.start']
      .map(function (prop) {
        return _.property(prop)(value);
      })
      .filter(function (prop) {
        return !prop;
      });
    return properties.length ? {result: 'WRONG scripts section'} : {};
  }
};
