'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var db = require('./database');
var utils = require('./utils');
var secrets = require('./secrets');

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
      if (err) {
        return done(null, false);
      }
      if (result.length > 0) {
        done(err, result[0]);
      } else {
        done(null, false);
      }
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

exports.localLoginStrategy = new LocalStrategy(
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

exports.facebookLoginStrategy = new FacebookStrategy({
    clientID        : secrets.fbClientId,
    clientSecret    : secrets.fbClientSecret,
    callbackURL     : 'http://localhost.com/api/facebook/callback',
    profileFields: ['id', 'emails', 'name']
  },
  // facebook will send back the profile
  function(token, refreshToken, profile, done) {
    // asynchronous
    process.nextTick(function() {
      var queryString = 
        'SELECT pid, username, email' +
        '  FROM player ' + 
        ' WHERE email = \'' + profile.emails[0].value + '\';';
      db.getConnection(function(connection) {
        connection.query(queryString, function(err, result, fields) {
          if (err) {
            console.log("[CRITICAL] Query error: " + err);
            return done(err);
          } else {
            if (result.length > 0) {
              return done(null, result[0]);
            } else {
              // create user
              var queryString =
                'INSERT INTO player(username, password, email)' +
                'VALUES (\'' + profile.name.givenName + profile.name.familyName + '\', \'' + profile.id + '\', \'' + profile.emails[0].value + '\');';
              console.log(queryString);
              connection.query(queryString, function(err, result, fields) {
                console.log(JSON.stringify(result));
                if (err) {
                  console.log("[CRITICAL] Query error: " + err);
                  return done(err);
                } else {
                  if(result.affectedRows > 0){
                    console.log("preparing to return");
                    var newUser = {
                      pid : result.insertId,
                      username : profile.name.givenName + profile.name.familyName,
                      email : profile.emails[0].value
                    };
                    console.log(JSON.stringify(newUser));
                    return done(null, newUser);
                  } else {
                    return done(false);
                  }
                }
              });
            }
          }
        });
      });
    });
  }
);
