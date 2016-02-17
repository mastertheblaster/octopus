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
  print: function (values) {
    console.log(values);
    return values;
  },
  printKeyValue: function (value) {
    _.keys(value).sort().forEach(function (key) {
      console.log(_.padEnd(key, 48), value[key]);
    });
    return value;
  }
};
