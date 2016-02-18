'use strict';

const _       = require('lodash');
const process = require('process');


module.exports = {
  printer: function (attributes, format) {
    if (format === 'csv') {
      return function (values) {
        values.forEach(function (value, index) {
          var keys = attributes ? attributes.split(',') : _.keys(value);
          if (index === 0) {
            console.log(keys.join(','));
          }
          console.log(keys.map(function (key) {
            return _.property(key)(value);
          }).join(','));
        });
        return values;
      };
    }
    return function (values) {
      values
        .map(function (value) {
          return attributes ? _.pick(value, attributes.split(',')) : value;
        })
        .forEach(function (value) {
          console.log(JSON.stringify(value, null, 2));
        });
      return values;
    };
  },
  filter: function (query) {
    return function (values) {
      return query ? values.filter(function (value) {
        return _.includes(JSON.stringify(value).toLowerCase(), query.toLowerCase());
      }) : values;
    };
  },
  print: function (what) {
    console.log(what);
  },
  printError: function (error) {
    process.stderr.write('Sorry, FAILED! See details below.');
    process.stderr.write('\n');
    process.stderr.write(error ? error.toString() : '');
    process.stderr.write('\n');
  }
};
