'use strict';

const Q       = require('bluebird');
const request = require('request');


function call(config, path) {
  return new Q(function (resolve, reject) {
    config
      .auth()
      .then(function (creds) {
        console.log('Getting', path, '...');
        request.get({
          url: [config.host, path].join(''),
          json: true,
          auth: {
            user: creds.user,
            pass: creds.pass,
            sendImmediately: false
          }
        }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            resolve(body);
          } else {
            reject('CI call failed');
          }
        });
      })
      .catch(reject);
  });
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
      }
    };
  }
};
