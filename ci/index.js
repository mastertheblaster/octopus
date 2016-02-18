'use strict';

const Q       = require('bluebird');
const request = require('request');
const _       = require('lodash');
const process = require('process');


function callCi(config, path, resolve, reject) {
  process.stderr.write(['Getting', path, '...\n'].join(' '));
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

module.exports = {
  groupBuildTypes: function (buildTypes) {
    return _(buildTypes)
      .groupBy(function (build) {
        return _.property('template.id')(build) || '???';
      })
      .mapValues(function (value) {
        return value.length;
      })
      .map(function (value, key) {
        return {templateId: key, count: value};
      })
      .value();
  },
  groupRepos: function (repos) {
    return _(repos)
      .groupBy(function (repo) {
        return repo.host;
      })
      .map(function (value, key) {
        return {host: key, count: value.length};
      })
      .value();
  },
  explodeRepos: function (repos) {
    return repos
      .map(function (root) {
        return {
          id: root.id,
          url: (root.properties.property.find(function (property) {
            return property.name === 'url';
          }) || {value: ''}).value
        };
      })
      .map(function (repo) {
        var defaults = {host: '???', owner: '???', name: '???', isOnGitHub: false};
        if (repo.url.indexOf('git@') === -1) {
          return _.assign({}, defaults, repo, {
            host: repo.url
          });
        }
        var hostPath = repo.url.split(':', 2);
        var ownerName = _.last(hostPath).split('/', 2);
        return _.assign({}, defaults, repo, {
          host: _.first(hostPath),
          owner: _.first(ownerName),
          name: _.last(ownerName),
          isOnGitHub: repo.url.indexOf('github.com') !== -1
        });
      });
  },
  client: function (config) {
    return {
      getProjects: function () {
        return call(config, '/httpAuth/app/rest/projects/')
          .then(function (projects) {
            return projects.project;
          });
      },
      getBuildTypes: function () {
        return call(config, '/httpAuth/app/rest/buildTypes/?fields=buildType(id,name,projectName,projectId,template,vcs-root-entries)')
          .then(function (buildTypes) {
            return buildTypes.buildType;
          });
      },
      getVcsRoots: function () {
        return call(config, '/httpAuth/app/rest/vcs-roots/?fields=vcs-root(id,properties(property))')
          .then(function (roots) {
            return roots['vcs-root'];
          });
      }
    };
  }
};
