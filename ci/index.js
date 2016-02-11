/* jshint latedef: false */
'use strict';

const Q       = require('bluebird');
const request = require('request');
const _       = require('lodash');


function call(config, path) {
  return new Q(function (resolve, reject) {
    Q
      .reduce([getCiHost, getCiCreds], function (result, callback) {
        return callback(config)
          .then(function (callbackResult) {
            return _.assign({}, result, callbackResult);
          });
      }, {})
      .then(function (result) {
        callCi(result, path, resolve, reject);
      })
      .catch(reject);
  });
}

function callCi(config, path, resolve, reject) {
    console.log('Getting', path, '...');
    request.get({
      url: [config.host, path].join(''),
      json: true,
      auth: {
        user: config.user,
        pass: config.pass,
        sendImmediately: false
      }
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject('CI call failed');
      }
    });
  }

function getCiCreds(config) {
  return _.isFunction(config.auth) ?
    config.auth() : Q.resolve(config.auth);
}

function getCiHost(config) {
  return _.isFunction(config.host) ?
    config.host().then(function (host) {
      return {host: host};
    }) : Q.resolve({host: config.host});
}

module.exports = {
  client: function (config) {
    return {
      getProjects: function () {
        return call(config, '/httpAuth/app/rest/projects/');
      },
      getProject: function (project) {
        return call(config, project.href);
      },
      getBuild: function (build) {
        return call(config, build.href);
      },
      getBuildVcs: function (build) {
        var href = _.first(build['vcs-root-entries']['vcs-root-entry'])['vcs-root'].href;
        return call(config, href);
      }
    };
  }
};
