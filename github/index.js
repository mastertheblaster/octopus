'use strict';

const Q       = require('bluebird');
const request = require('request');
const _       = require('lodash');


function callGitHub(config, path, resolve, reject) {
  console.log('Getting', path, '...');
  request.get({
    url: ['https://raw.githubusercontent.com/', path].join(''),
    json: true,
    headers: {
      'Authorization': 'token ' + config.token,
      'Accept': 'application/vnd.github.v3.raw'
    }
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      resolve(body);
    } else {
      reject('GITHUB call failed');
    }
  });
}

function getGitHubToken(config) {
  return _.isFunction(config.token) ?
    config.token() : Q.resolve(config.token);
}

function call(config, path) {
  return new Q(function (resolve, reject) {
    getGitHubToken(config)
      .then(function (result) {
        callGitHub(result, path, resolve, reject);
      })
      .catch(reject);
  });
}

module.exports = {
  client: function (config) {
    return {
      getPackageJson: function (repo) {
        var path = _.last(repo.split(':')).replace('.git', '') + '/master/package.json';
        return call(config, path);
      }
    };
  }
};
