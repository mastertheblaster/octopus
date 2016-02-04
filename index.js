/* jshint latedef: false */
'use strict';

const Q     = require('bluebird');
const _     = require('lodash');
const shell = require('shelljs');
const fs    = require('fs');
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
  .then(filterUniqueRepos)
  .then(cloneOrPullRepos)
  .then(readRepoPackageJson)
  .then(validateScriptsSection)
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

function filterUniqueRepos(repos) {
  return _.uniq(repos);
}

function getRepoDir(repo) {
  return __dirname + '/tmp/' + _.last(repo.split('/'));
}

function cloneOrPullRepos(repos) {
  repos.forEach(repo => {
    let dir = getRepoDir(repo);
    if (!fs.existsSync(dir)) {
      if (_.includes(repo, 'github.com')) {
        shell.exec('git clone --depth 1 ' + repo + ' ' + dir);
      } else {
        console.log('Unsupported repo', repo);
      }
    } else {
      //console.log('Updating repo', repo);
      //shell.exec('cd ' + dir + ' && git pull');
    }
  });
  return repos;
}

function readRepoPackageJson(repos) {
  return repos.map(function (repo) {
    let packageJson = getRepoDir(repo) + '/package.json';
    if (fs.existsSync(packageJson)) {
      return {
        repo: repo,
        json: JSON.parse(fs.readFileSync(packageJson))
      };
    }
    return { repo: repo };
  });
}

function validateScriptsSection(repos) {
  repos.forEach(function (repo) {
    if (!repo.json) {
      console.log(_.padEnd(repo.repo, 80), 'package.json is missing');
    } else if (!repo.json.scripts) {
      console.log(_.padEnd(repo.repo, 80), 'scripts section is missing');
    } else {
      let valid = ['build', 'release', 'test', 'start'].reduce(function (valid, curr) {
        return !valid ? valid : !!repo.json.scripts[curr];
      }, true);
      if (!valid) {
        console.log(_.padEnd(repo.repo, 80), 'scripts section is incorrect');
      }
    }
  });
  return repos;
}

function handleError(error) {
  console.error(error);
}
