#!/usr/bin/env node

'use strict';

const os      = require('os');
const process = require('process');
const Q       = require('bluebird');
const shell   = require('shelljs');
const _       = require('lodash');
const program = require('commander');
const auth    = require('./auth');
const ci      = require('./ci');
const cache   = require('./cache');

const CACHE_DIR = os.tmpdir() + '/octopus-1369bdd4-de3a-448d-bbc6-d0bdff74783e';

let ciClient = ci.client({
  host: _.memoize(function () {
    return auth.getHost('Connecting to CI...');
  }),
  auth: _.memoize(function () {
    return auth.getCreds('Authentication required for CI...');
  })
});

cache.toFile(ciClient, 'getProjects', CACHE_DIR + '/projects.json');
cache.toFile(ciClient, 'getProject',  CACHE_DIR + '/project-${id}.json');
cache.toFile(ciClient, 'getBuild',    CACHE_DIR + '/build-${id}.json');
cache.toFile(ciClient, 'getBuildVcs', CACHE_DIR + '/vcs-${id}.json');

program
  .version('1.0.0')
  .description('Tool for querying TeamCity (CI) and GIT');

program
  .command('cache [command]')
  .description('Cache manipulation')
  .action(function (command) {
    if (command === 'dir') {
      console.log(CACHE_DIR);
    } else if (command === 'clean') {
      shell.rm(CACHE_DIR + '/projects.json');
      shell.rm(CACHE_DIR + '/project-*.json');
      shell.rm(CACHE_DIR + '/build-*.json');
      shell.rm(CACHE_DIR + '/vcs-*.json');
    } else {
      console.log(shell.ls(CACHE_DIR));
    }
  });

program
  .command('projects [query]')
  .description('List the projects on CI')
  .action(function (query) {
    ciClient
      .getProjects()
      .then(function (projects) {
        console.log(projects.project.filter(function (project) {
          return query ? _.includes(JSON.stringify(project).toLowerCase(), query.toLowerCase()) : true;
        }));
      })
      .catch(console.error);
  });

program
  .command('builds [query]')
  .description('List all the builds on CI')
  .action(function (query) {
    ciClient
      .getProjects()
      .then(function (projects) {
        return Q.reduce(projects.project, function (out, project) {
          return ciClient.getProject(project).then(function (project) {
            return out.concat(project);
          });
        }, []);
      })
      .then(function (projects) {
        return _.flattenDeep(projects.map(function (project) {
          return (project.buildTypes || {}).buildType || [];
        }));
      })
      .then(function (builds) {
        return Q.reduce(builds, function (out, build) {
          return ciClient.getBuild(build).then(function (build) {
            return out.concat(build);
          });
        }, []);
      })
      .then(function (builds) {
        console.log(builds.filter(function (build) {
          return query ? _.includes(JSON.stringify(build).toLowerCase(), query.toLowerCase()) : true;
        }));
      })
      .catch(console.error);
  });

program.parse(process.argv);