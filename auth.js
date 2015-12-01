'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var db = require('./database');
var utils = require('./utils');

exports.logout = function(req, res){
  if (req.isAuthenticated()) {
    req.logOut();
  } 
  res.json(null);
};

exports.login = function(req, res) {
  console.log('Sending back req.user: ' + JSON.stringify(req.user));
  res.send(req.user);
};
  
exports.checkAuthenticated = function(req, res) {
  if (!req.isAuthenticated()) {
    return res.json(null);
  } else {
    return res.json(req.user);
  }
};

exports.serializeUser = function(user, done) {
  done(null, user.pid);
};

exports.deserializeUser = function(id, done) {
  var queryString = 
    'SELECT pid, username, email' +
    '  FROM player ' + 
    ' WHERE pid = ' + id + ';';
  db.getConnection(function(connection) {
    connection.query(queryString, function(err, result) {
      done(err, result[0]);
    });
  });
};

exports.check = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.sendStatus(401);
  }
};

exports.localStrategy = new LocalStrategy(
  function(username, password, done) {
    var queryString = 
      'SELECT pid, username, email' +
      '  FROM player ' + 
      ' WHERE username = \'' + utils.sanitize(username) + '\'' +
      '   AND password = \'' + utils.sanitize(password) + '\';';
    db.getConnection(function(connection) {
      connection.query(queryString, function(err, result, fields) {
        if (err) {
          console.log("[CRITICAL] Query error: " + err);
          return done(err);
        } else {
          if (result.length > 0) {
            return done(null, result[0]);
          } else {
            return done(null, false);
          }
        }
      });
    });
});