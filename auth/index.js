'use strict';

const Q       = require('bluebird');
const _       = require('lodash');
const read    = require('read');
const process = require('process');


function getToken(prompt) {
  process.stderr.write(prompt + '\n');
  return new Q(function (resolve, reject) {
    read({prompt: 'Token: ', output: process.stderr}, function (error, token, isDefault) {
      if (error || isDefault || !token) {
        reject('Bad token');
      } else {
        resolve({token: token});
      }
    });
  });
}

function getPass() {
  return new Q(function (resolve, reject) {
    read({prompt: 'Pass: ', silent: true, output: process.stderr}, function (error, pass, isDefault) {
      if (error || isDefault || !pass) {
        reject('Bad pass');
      } else {
        resolve({pass: pass});
      }
    });
  });
}

function getUser() {
  return new Q(function (resolve, reject) {
    read({prompt: 'User: ', output: process.stderr}, function (error, user, isDefault) {
      if (error || isDefault || !user) {
        reject('Bad user');
      } else {
        resolve({user: user});
      }
    });
  });
}

function getHost(prompt) {
  process.stderr.write(prompt + '\n');
  return new Q(function (resolve, reject) {
    read({prompt: 'Host:', output: process.stderr}, function (error, host, isDefault) {
      if (error || isDefault || !host) {
        reject('Bad host');
      } else {
        resolve(host);
      }
    });
  });
}

function getCreds(prompt) {
  process.stderr.write(prompt + '\n');
  return Q.reduce([getUser, getPass], function (result, task) {
    return task().then(function (taskResult) {
      return _.merge({}, result, taskResult);
    });
  }, {});
}

module.exports = {
  getCreds: getCreds,
  getHost: getHost,
  getToken: getToken
};
