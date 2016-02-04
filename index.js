/* jshint latedef: false */
'use strict';

const Q     = require('bluebird');
const _     = require('lodash');
const auth  = require('./auth');
const ci    = require('./ci');
const cache = require('./cache');


// Ask for CI credentials only once.
let ciCreds = _.memoize(function () {
  return auth.getCreds('Credentials for CI required');
});

// Create a CI client.
let ciClient = ci.client({
  host: '[ci host name including the port]',
  auth: ciCreds
});

// Cache the responses to files inside tmp folder.
// So next time you run the app it will not call the CI.
cache.toFile(ciClient, 'getProjects', __dirname + '/tmp/projects.json');
cache.toFile(ciClient, 'getProject',  __dirname + '/tmp/project-${id}.json');
cache.toFile(ciClient, 'getBuild',    __dirname + '/tmp/build-${id}.json');
cache.toFile(ciClient, 'getBuildVcs', __dirname + '/tmp/vcs-${id}.json');

ciClient
  .getProjects()
  .then(excludeArchivedProjects)
  .then(getProjectDetails)
  .then(extractProjectBuilds)
  .then(getBuildDetails)
  .then(groupBuildsByTemplateId)
  .then(showBuildReport)
  .then(function (builds) {
    return extractBuildRepoUrl(builds.NewAngularTemplate);
  })
  .then(function (repos) {
    repos.forEach(repo => {
      console.log(repo);
    });
  })
  .catch(handleError);

function excludeArchivedProjects(projects) {
  return projects.project.filter(function (project) {
    return project.archived !== true;
  });
}

function getProjectDetails(projects) {
  return Q.reduce(projects, function (out, project) {
    return ciClient.getProject(project).then(function (project) {
      return out.concat(project);
    });
  }, []);
}

function extractProjectBuilds(projects) {
  return _.flattenDeep(projects.map(function (project) {
    return (project.buildTypes || {}).buildType || [];
  }));
}

function getBuildDetails(builds) {
  return Q.reduce(builds, function (out, build) {
    return ciClient.getBuild(build).then(function (build) {
      return out.concat(build);
    });
  }, []);
}

function groupBuildsByTemplateId(builds) {
  return _.groupBy(builds, function (build) {
    return build.template ? build.template.id || '???' : '???';
  });
}

function showBuildReport(builds) {
  var separator = _.padEnd('', 44, '-');
  console.log('BUILDS USING THE TEMPLATES');
  console.log(separator);
  _.keys(builds).sort().forEach(function (key) {
    console.log(_.padEnd(key, 40), _.padStart(builds[key].length, 3));
  });
  console.log(separator);
  return builds;
}

function extractBuildRepoUrl(builds) {
  return Q.reduce(builds, function (out, build) {
    return ciClient.getBuildVcs(build).then(function (vscRoots) {
      return out.concat(vscRoots);
    });
  }, []).then(function (roots) {
    return roots.map(function (root) {
      return _.first(root.properties.property.filter(function (property) {
        return property.name === 'url';
      })).value;
    });
  });
}

function handleError(error) {
  console.error(error);
}
