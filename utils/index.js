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
  }
};
