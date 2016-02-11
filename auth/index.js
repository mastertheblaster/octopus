'use strict';

const Q    = require('bluebird');
const _    = require('lodash');
const read = require('read');


function getPass() {
  return new Q(function (resolve, reject) {
    read({prompt: 'Pass: ', silent: true}, function (error, pass, isDefault) {
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
    read({prompt: 'User: '}, function (error, user, isDefault) {
      if (error || isDefault || !user) {
        reject('Bad user');
      } else {
        resolve({user: user});
      }
    });
  });
}

function getHost(prompt) {
  console.log(prompt);
  return new Q(function (resolve, reject) {
    read({prompt: 'Host:'}, function (error, host, isDefault) {
      if (error || isDefault || !host) {
        reject('Bad host');
      } else {
        resolve(host);
      }
    });
  });
}

function getCreds(prompt) {
  console.log(prompt);
  return Q.reduce([getUser, getPass], function (result, task) {
    return task().then(function (taskResult) {
      return _.merge({}, result, taskResult);
    });
  }, {});
}

module.exports = {
  getCreds: getCreds,
  getHost: getHost
};
