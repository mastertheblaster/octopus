#!/usr/bin/env node

'use strict';

const os      = require('os');
const process = require('process');
const shell   = require('shelljs');
const _       = require('lodash');
const program = require('commander');
const auth    = require('./auth');
const ci      = require('./ci');
const cache   = require('./cache');
const utils   = require('./utils');

const CACHE_DIR = os.tmpdir() + '/octopus-1369bdd4-de3a-448d-bbc6-d0bdff74783e';


let ciClient = ci.client({
  host: _.memoize(function () {
    return auth.getHost('Connecting to CI...');
  }),
  auth: _.memoize(function () {
    return auth.getCreds('Authentication required for CI...');
  })
});

cache.toFile(ciClient, 'getProjects',   CACHE_DIR + '/projects.json');
cache.toFile(ciClient, 'getBuildTypes', CACHE_DIR + '/build-types.json');
cache.toFile(ciClient, 'getVcsRoots',   CACHE_DIR + '/vcs-roots.json');

program
  .version('1.0.0')
  .description('Tool for querying TeamCity (CI) and GITHUB');

program
  .command('cache [command]')
  .description('Cache manipulation')
  .action(function (command) {
    if (command === 'dir') {
      console.log(CACHE_DIR);
    } else if (command === 'clean') {
      shell.rm(CACHE_DIR + '/projects.json');
      shell.rm(CACHE_DIR + '/build-types.json');
      shell.rm(CACHE_DIR + '/vcs-roots.json');
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
      .then(utils.filter(query))
      .then(utils.printJson)
      .catch(utils.printError);
  });

program
  .command('builds [query]')
  .description('List all build types on CI')
  .action(function (query) {
    ciClient
      .getBuildTypes()
      .then(utils.filter(query))
      .then(utils.printJson)
      .catch(utils.printError);
  });

program
  .command('repos [query]')
  .description('List all repos (vcs-roots) on CI')
  .action(function (query) {
    ciClient
      .getVcsRoots()
      .then(utils.filter(query))
      .then(utils.printJson)
      .catch(utils.printError);
  });

program
  .command('report:builds')
  .description('Show build summary report')
  .action(function () {
    ciClient
      .getBuildTypes()
      .then(ci.groupBuildTypes)
      .then(utils.printJson)
      .catch(utils.printError);
  });

program
  .command('report:repos')
  .description('Show repository summary report')
  .action(function () {
    ciClient
      .getVcsRoots()
      .then(ci.explodeRepos)
      .then(ci.groupRepos)
      .then(utils.printJson)
      .catch(utils.printError);
  });

program
  .command('report:repos-for-template [template]')
  .description('Show repositories of given build template')
  .action(function (template) {
    ciClient
      .getBuildTypes()
      .then(function (buildTypes) {
        return ci.getRepoIdsOfBuildTypes(buildTypes, template);
      })
      .then(function (repoIds) {
        ciClient
          .getVcsRoots()
          .then(ci.explodeRepos)
          .then(function (repos) {
            return repos.filter(function (repo) {
              return _.includes(repoIds, repo.id);
            });
          })
          .then(function (repos) {
            return repos
              .map(function (repo) {
                return repo.url;
              })
              .sort();
          })
          .then(utils.printJson)
          .catch(utils.printError);
      })
      .catch(utils.printError);

    ciClient.getVcsRoots();

  });

program.parse(process.argv);
