#!/usr/bin/env node

/* jshint latedef:false */
'use strict';

const Q       = require('bluebird');
const os      = require('os');
const process = require('process');
const shell   = require('shelljs');
const _       = require('lodash');
const program = require('commander');
const auth    = require('./auth');
const ci      = require('./ci');
const gh      = require('./github');
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

let ghClient = gh.client({
  token: _.memoize(function () {
    return auth.getToken('Connecting to github...');
  })
});

cache.toFile(ciClient, 'getProjects',    CACHE_DIR + '/projects.json');
cache.toFile(ciClient, 'getBuildTypes',  CACHE_DIR + '/build-types.json');
cache.toFile(ciClient, 'getVcsRoots',    CACHE_DIR + '/vcs-roots.json');
cache.toFile(ghClient, 'getPackageJson', CACHE_DIR + '/${arguments[0].replace(/[@:./~]/g, "_")}.json');

program
  .version('1.0.0')
  .description('Tool for querying TeamCity (CI) and GITHUB');

program
  .command('cache [command]')
  .description('Cache manipulation')
  .action(function (command) {
    if (command === 'dir') {
      utils.print(CACHE_DIR);
    } else if (command === 'clean') {
      silently(function () {
        shell.rm(CACHE_DIR + '/*.json');
      });
    } else {
      silently(function () {
        shell.ls(CACHE_DIR).forEach(utils.print);
      });
    }
    function silently(callback) {
      var isSilent = shell.config.silent;
      shell.config.silent = true;
      callback();
      shell.config.silent = isSilent;
    }
  });

program
  .command('projects')
  .option('-q, --query <value>', 'Only with description')
  .option('-a, --attributes <value...>', 'Only attributes')
  .option('-f, --format <value>', 'Output format')
  .description('List all projects')
  .action(function () {
    ciClient
      .getProjects()
      .then(utils.filter(this.query))
      .then(utils.printer(this.attributes, this.format))
      .catch(utils.printError);
  });

program
  .command('builds')
  .option('-q, --query <value>', 'Only with description')
  .option('-a, --attributes <value...>', 'Only attributes')
  .option('-f, --format <value>', 'Output format')
  .description('List all the builds')
  .action(function () {
    ciClient
      .getBuildTypes()
      .then(utils.filter(this.query))
      .then(utils.printer(this.attributes, this.format))
      .catch(utils.printError);
  });

program
  .command('repos')
  .option('-q, --query <value>', 'Only with description')
  .option('-a, --attributes <value...>', 'Only attributes')
  .option('-f, --format <value>', 'Output format')
  .description('List all repos (vcs-roots)')
  .action(function () {
    ciClient
      .getVcsRoots()
      .then(utils.filter(this.query))
      .then(utils.printer(this.attributes, this.format))
      .catch(utils.printError);
  });

program
  .command('report:builds')
  .option('-q, --query <value>', 'Only with description')
  .option('-a, --attributes <value...>', 'Only attributes')
  .option('-f, --format <value>', 'Output format')
  .description('Show build summary report')
  .action(function () {
    ciClient
      .getBuildTypes()
      .then(ci.groupBuildTypes)
      .then(utils.filter(this.query))
      .then(utils.printer(this.attributes, this.format))
      .catch(utils.printError);
  });

program
  .command('report:repos')
  .option('-f, --format <value>', 'Output format')
  .description('Show repository summary report')
  .action(function () {
    ciClient
      .getVcsRoots()
      .then(ci.explodeRepos)
      .then(ci.groupRepos)
      .then(utils.printer(null, this.format))
      .catch(utils.printError);
  });

program
  .command('analyze <template>')
  .option('-a, --attributes <value...>', 'Only attributes')
  .option('-f, --format <value>', 'Output format')
  .description('Show analytics for a given build type (template)')
  .action(function (template) {

    var attributes = this.attributes,
        format = this.format;

    ciClient
      .getBuildTypes()
      .then(function (buildTypes) {
        // Filter only builds having a given template.
        return buildTypes.filter(function (build) {
          return build.template && build.template.id === template;
        });
      })
      .then(function (buildTypes) {
        // Extract the build repository ID.
        return buildTypes.map(function (build) {
          return _.assign(build, {
            repoId: _.first(build['vcs-root-entries']['vcs-root-entry']).id
          });
        });
      })
      .then(function (buildTypes) {
        var targetRepoIds = buildTypes.map(function (build) { return build.repoId; });
        ciClient
          .getVcsRoots()
          .then(ci.explodeRepos)
          .then(function (repos) {
            return repos.filter(function (repo) {
              return _.includes(targetRepoIds, repo.id);
            });
          })
          .then(function (repos) {
            return Q.reduce(repos, function (result, repo) {
              if (repo.isOnGitHub) {
                return ghClient
                  .getPackageJson(repo.url)
                  .then(function (json) {
                    return result.concat(_.assign(repo, {downloaded: true, scripts: json.scripts}));
                  })
                  .catch(function () {
                    return result.concat(repo);
                  });
              } else {
                return result.concat(repo);
              }
            }, []);
          })
          .then(function (repos) {
            return buildTypes.map(function (build) {
              return _.assign(build, {repo: repos.find(function (repo) {
                return build.repoId === repo.id;
              })});
            });
          })
          .then(utils.printer(attributes, format))
          .catch(utils.printError);
      })
      .catch(utils.printError);
  });

program.parse(process.argv);
