/* jshint latedef: false */
'use strict';

const Q     = require('bluebird');
const _     = require('lodash');
const auth  = require('./auth');
const ci    = require('./ci');
const cache = require('./cache');


let ciCreds = _.memoize(function () {
  return auth.getCreds('Credentials for CI required');
});

let ciClient = ci.client({
  host: '[ci host name including the port]',
  auth: ciCreds
});

cache.toFile(ciClient, 'getProjects', __dirname + '/tmp/projects.json');
cache.toFile(ciClient, 'getProject',  __dirname + '/tmp/project-${id}.json');
cache.toFile(ciClient, 'getBuild',    __dirname + '/tmp/build-${id}.json');

ciClient
  .getProjects()
  .then(excludeArchived)
  .then(function (projects) {
    return Q.reduce(projects, function (out, project) {
      return ciClient.getProject(project).then(function (project) {
        return out.concat(project);
      });
    }, []);
  })
  .then(flattenBuilds)
  .then(function (builds) {
    return Q.reduce(builds, function (out, build) {
      return ciClient.getBuild(build).then(function (build) {
        return out.concat(build);
      });
    }, []);
  })
  .then(groupBuildsByTemplateId)
  .then(showBuildReport)
  .catch(handleError);

function handleError(error) {
  console.error(error);
}

function flattenBuilds(projects) {
  return _.flattenDeep(projects.map(function (project) {
    return (project.buildTypes || {}).buildType || [];
  }));
}

function groupBuildsByTemplateId(builds) {
  return _.groupBy(builds, function (build) {
    return build.template ? build.template.id || '???' : '???';
  });
}

function showBuildReport(builds) {
  console.log('BUILD STATISTICS:');
  _.keys(builds).sort().forEach(function (key) {
    console.log(key, ':', builds[key].length);
  });
}

function excludeArchived(projects) {
  return projects.project.filter(function (project) {
    return project.archived !== true;
  });
}
