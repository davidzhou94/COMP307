var https = require('https');
var fs = require('fs');
var http = require('http');
var express = require('express');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var app = express();
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var path = require('path');
var mysql = require('mysql');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');

app.use(cookieParser());
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(cookieSession({ 
  genid : function(req) { return generateGUID },
  secret : 'wubbalubbadubdub',
  resave : true,
  saveUninitialized : true,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) }
}));
app.use(methodOverride());

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  console.log('Serializing user: ' + JSON.stringify(user.pid));
  done(null, user.pid);
  //done(null, user);
});

passport.deserializeUser(function(id, done) {
  console.log('Deserializing user: ' + id);
  var queryString = 
    'SELECT pid, username, email' +
    '  FROM player ' + 
    ' WHERE pid = ' + id + ';';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result) {
      console.log('Deserializing user with result: ' + JSON.stringify(result[0]));
      done(err, result[0]);
    });
  });
  //done(null, user);
});

function generateGUID() {
  return crypto.randomBytes(48).toString('hex');
}

function authenticatedRequest(req, res, next) {
  console.log('Checking authentication for user ' + JSON.stringify(req.user));
  console.log('Checking authentication for session ' + JSON.stringify(req.session));
  if (req.isAuthenticated()) {
    console.log('Request was authenticated');
    next();
  } else {
    console.log('Request was not authenticated');
    res.sendStatus(401);
  }
}

passport.use('local-login', new LocalStrategy(
  function(username, password, done) {
    var queryString = 
      'SELECT pid, username, email' +
      '  FROM player ' + 
      ' WHERE username = \'' + sanitize(username) + '\'' +
      '   AND password = \'' + sanitize(password) + '\';';
    getConnection(function(connection) {
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
}));

var sanitize = function (str) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\"+char; // prepends a backslash to backslash, percent,
                          // and double/single quotes
    }
  });
}

var pool  = mysql.createPool({
  connectionLimit : 100,
  host     : 'localhost',
  user     : 'testuser',
  password : 'password',
  database : 'db'
});

var getConnection = function(callback) {
  pool.getConnection(function(err, connection) {
    if (err){
      console.log("[CRITICAL] Connection error: " + err);
    } else {
      callback(connection);
    }
  });
};

var simpleQuery = function(queryString, res) {
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err) {
        console.log("[CRITICAL] Query error: " + err);
        res.json(null);
      } else {
        res.json(result);
      }
    });

    connection.release();
  });
}

var singleRowQuery = function(queryString, res) {
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null);
      } else {
        if(result.length > 0){
          res.json(result[0]);
        } else {
          res.json(null);
        }
      }
    });

    connection.release();
  });
}

app.get('/api/getActorsByLeague/:leagueId', 
  authenticatedRequest,
  function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getActionsByLeague/:leagueId', 
  authenticatedRequest,
  function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM action' + 
    ' WHERE action.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getTeamsByLeague/:leagueId', 
  authenticatedRequest,
  function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT t.tid, t.team_name, p.username, t.total_points ' +
    '  FROM v_f_team AS t' + 
    '  LEFT JOIN player AS p' +
    '    ON t.player_id = p.pid' +
    ' WHERE t.lid= ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getLeaguesByPlayer/:playerId', 
  authenticatedRequest, 
  function(req, res) {
  var playerId = req.params.playerId;
  if (req.user.pid != playerId) {
    return res.sendStatus(401);
  }
  var queryString = 
    'SELECT f_league.lid,' +
    '       f_league.description,' +
    '       v_f_team.tid,' +
    '       v_f_team.team_name,' +
    '       v_f_team.total_points' +
    '  FROM v_f_team' + 
    '  LEFT JOIN f_league' +
    '    ON v_f_team.lid = f_league.lid' +
    ' WHERE v_f_team.player_id = ' + playerId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getAvailableLeaguesByPlayer/:playerId', 
  authenticatedRequest,
  function(req, res) {
  var playerId = req.params.playerId;
  if (req.user.pid != playerId) {
    return res.sendStatus(401);
  }
  var queryString = 
    'SELECT f_league.lid,' +
    '       f_league.description,' +
    '       player.username AS owner,' +
    '       player.pid AS owner_id,' +
    '       COUNT(f_team.tid) AS num_teams' +
    '  FROM f_league' +
    '  JOIN f_team' +
    '    ON f_league.lid = f_team.lid' +
    '  LEFT JOIN player' +
    '    ON f_league.owner_id = player.pid' +
    ' WHERE f_league.active = 1 AND' +
    '       f_league.lid NOT IN (' +
    '    SELECT DISTINCT f_team.lid ' +
    '      FROM f_team' +
    '     WHERE f_team.player_id = ' + playerId + ')' +
    ' GROUP BY f_league.lid;';
  simpleQuery(queryString, res);
});

app.get('/api/getLeagueOwner/:leagueId', 
  authenticatedRequest,
  function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT f_league.owner_id' +
    '  FROM f_league' +
    ' WHERE f_league.lid = ' + leagueId + ';';
  singleRowQuery(queryString, res);
});

app.get('/api/getTeamOwner/:teamId', 
  authenticatedRequest,
  function(req, res) {
  var teamId = req.params.teamId;
  var queryString = 
    'SELECT f_team.player_id' +
    '  FROM f_team' +
    ' WHERE f_team.tid = ' + teamId + ';';
  singleRowQuery(queryString, res);
});

app.get('/api/getPlayer/:playerId', 
  authenticatedRequest,
  function(req, res) {
  var playerId = req.params.playerId;
  if (req.user.pid != playerId) {
    return res.sendStatus(401);
  }
  var queryString = 
    'SELECT pid, username, email' +
    '  FROM player' + 
    ' WHERE pid = ' + playerId + ';';
  singleRowQuery(queryString, res);
});

app.post('/api/login', 
  passport.authenticate('local-login'), 
  function (req, res) {
    console.log('Sending back req.user: ' + JSON.stringify(req.user));
    res.send(req.user);
});

app.get('/api/logout', function(req, res){
  if (req.isAuthenticated()) {
    req.logOut();
  } 
  res.json(null);
});

app.get('/api/getDraftsByTeam/:teamId', 
  authenticatedRequest,
  function(req, res) {
  var teamId = req.params.teamId;
  var queryString = 
    'SELECT d.participated_id, ' +
    '       d.fulfilled, ' +
    '       ar.description AS actor, ' +
    '       ar.actor_id, ' +
    '       an.description AS action, ' +
    '       an.action_id, ' +
    '       an.points' +
    '  FROM drafted_rule AS d' + 
    '  LEFT JOIN actor AS ar' +
    '    ON d.actor_id = ar.actor_id' +
    '  LEFT JOIN action AS an' +
    '    ON d.action_id = an.action_id' +
    ' WHERE d.f_team_id = ' + teamId +
    ' ORDER BY d.participated_id;';
  simpleQuery(queryString, res);
});

app.get('/api/getAvailablePicksByTeam/:teamId', 
  authenticatedRequest,
  function(req, res) {
  var teamId = req.params.teamId;
  var queryString = 
    'SELECT ar.description AS actor, ' +
    '       ar.actor_id, ' +
    '       an.description AS action, ' +
    '       an.action_id, ' +
    '       an.points' +
    '  FROM actor AS ar' +
    '  JOIN action AS an' +
    '    ON ar.f_league_id = an.f_league_id' +
    '  LEFT JOIN drafted_rule AS d' +
    '    ON d.actor_id = ar.actor_id AND' +
    '       d.action_id = an.action_id' +
    '  LEFT JOIN f_team AS t' +
    '    ON t.lid = ar.f_league_id' +
    ' WHERE ar.f_league_id = t.lid AND' +
    '       an.f_league_id = t.lid AND' +
    '       t.tid = ' + teamId + ' AND' +
    '       d.participated_id IS NULL' +
    ' ORDER BY ar.actor_id;';
  simpleQuery(queryString, res);
});

app.get('/api/getDraftsByLeague/:leagueId', 
  authenticatedRequest,
  function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT drafted_rule.participated_id,' +
    '       drafted_rule.action_id,' +
    '       drafted_rule.actor_id,' +
    '       drafted_rule.fulfilled,' +
    '       actor.description AS actor,' +
    '       action.description AS action,' +
    '       action.points' +
    '  FROM drafted_rule' +
    '  LEFT JOIN actor' +
    '    ON drafted_rule.actor_id = actor.actor_id' +
    '  LEFT JOIN action' +
    '    ON drafted_rule.action_id = action.action_id' +
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.post('/api/addDraftedRule', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString = "";
  if (obj.action === null) {
    queryString = 
      'INSERT INTO drafted_rule(action_id, actor_id, fulfilled, f_team_id)' +
      '   SELECT action.action_id,' +
      '   actor.actor_id,' +
      '   0 AS fulfilled,' +
      obj.team + ' AS f_team_id' +
      '     FROM actor' +
      '     JOIN action' +
      '       ON action.f_league_id = actor.f_league_id' +
      '     LEFT JOIN drafted_rule' +
      '       ON drafted_rule.actor_id = actor.actor_id AND' +
      '          drafted_rule.action_id = action.action_id' +
      '    WHERE drafted_rule.participated_id IS NULL AND' +
      '          actor.actor_id = ' + obj.actor + ';';
  } else {
    queryString = 
      'INSERT INTO drafted_rule(action_id, actor_id, fulfilled, f_team_id)' +
      'VALUES (' + obj.action + ', ' + obj.actor + ', 0, ' + obj.team + ');';
  }
  simpleQuery(queryString, res);
});

app.post('/api/removeDraftedRule', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString = "";
  if (obj.action === null) {
    queryString = 
      'DELETE FROM drafted_rule' +
      ' WHERE drafted_rule.actor_id = ' + obj.actor + ' AND' +
      '       drafted_rule.f_team_id = ' + obj.team + ';';
  } else {
    queryString = 
      'DELETE FROM drafted_rule' +
      ' WHERE drafted_rule.actor_id = ' + obj.actor + ' AND' +
      '       drafted_rule.action_id = ' + obj.action + ' AND' +
      '       drafted_rule.f_team_id = ' + obj.team + 
      ' LIMIT 1;';
  }
  simpleQuery(queryString, res);
});

app.post('/api/setFulfilledCount/', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString = "";
  if (obj.drafted_rule === null) {
    queryString = 
      'UPDATE drafted_rule' +
      '   SET drafted_rule.fulfilled = ' + obj.fulfilled +
      ' WHERE drafted_rule.actor_id = ' + obj.actor + ' AND' +
      '       drafted_rule.action_id = ' + obj.action + ';';
  } else {
    queryString = 
      'UPDATE drafted_rule' +
      '   SET drafted_rule.fulfilled = ' + obj.fulfilled +
      ' WHERE drafted_rule.participated_id = ' + obj.drafted_rule + ';';
  }
  simpleQuery(queryString, res);
});

app.post('/api/addActor', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO actor(description, f_league_id, managed_actor_id)' +
    'VALUES (\'' + sanitize(obj.description) + '\', ' + obj.leagueId + ', ' + obj.managedActorId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null);
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'SELECT *' +
            '  FROM actor' +
            ' WHERE actor.actor_id = ' + result.insertId;
          singleRowQuery(queryString, res);
        } else {
          res.json(null);
        }
      }
      connection.release
      
    });
  });
});

app.post('/api/removeActor', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM actor' +
    ' WHERE actor.actor_id = ' + obj.actor + ';';
  simpleQuery(queryString, res);
});

app.post('/api/addAction', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO action(description, points, f_league_id, managed_action_id)' +
    'VALUES (\'' + sanitize(obj.description) + '\', ' + obj.points + ', ' + obj.leagueId + ', ' + obj.managedActionId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null)
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'SELECT *' +
            '  FROM action' +
            ' WHERE action.action_id = ' + result.insertId;
          singleRowQuery(queryString, res);
        } else {
          res.json(null);
        }
      }
      connection.release
    });
  });
});

app.post('/api/removeAction', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM action' +
    ' WHERE action.action_id = ' + obj.action + ';';
  simpleQuery(queryString, res);
});

app.post('/api/addPlayer', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO player(username, password, email)' +
    'VALUES (\'' + sanitize(obj.username) + '\', \'' + sanitize(obj.password) + '\', \'' + sanitize(obj.email) + '\');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null);
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'SELECT *' +
            '  FROM player' +
            ' WHERE player.pid = ' + result.insertId;
          singleRowQuery(queryString, res);
        } else {
          res.json(null);
        }
      }
      connection.release
    });
  });
});

app.post('/api/addTeam', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO f_team(team_name, player_id, lid)' +
    'VALUES (\'' + sanitize(obj.teamName) + '\', ' + obj.playerId + ', ' + obj.leagueId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null)
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'SELECT *' +
            '  FROM f_team' +
            ' WHERE f_team.tid = ' + result.insertId;
          singleRowQuery(queryString, res);
        } else {
          res.json(null);
        }
      }
      connection.release
    });
  });
});

app.post('/api/addLeague', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO f_league(description, active, owner_id)' +
    'VALUES (\'' + sanitize(obj.leagueName) + '\', 1, ' + obj.ownerId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null)
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'INSERT INTO f_team(team_name, player_id, lid)' +
            'VALUES (\'' + sanitize(obj.teamName) + '\', ' + obj.ownerId + ', ' + result.insertId + ');';
          connection.query(queryString, function(err, result, fields) {
            if (err) {
              console.log("Query error: " + err);
              res.json(null)
            } else {
              var queryString =
                'SELECT *' +
                '  FROM f_team' +
                ' WHERE f_team.tid = ' + result.insertId + ';';
              singleRowQuery(queryString, res);
            }
          });
        } else {
          res.json(null);
        }
      }
      connection.release
    });
  });
});

app.post('/api/updatePlayer', 
  authenticatedRequest,
  function(req, res){
  var obj = req.body;
  if (req.user.pid != obj.playerId) {
    return res.sendStatus(401);
  }
  var queryString;
  if (obj.password === '') {
    queryString =
      'UPDATE player' +
      '   SET username = \'' + sanitize(obj.username) + '\',' +
      '       email = \'' + sanitize(obj.email) + '\'' +
      ' WHERE pid = ' + obj.playerId + ';';
  } else {
    queryString =
      'UPDATE player' +
      '   SET username = \'' + sanitize(obj.username) + '\',' +
      '       password = \'' + sanitize(obj.password) + '\',' +
      '       email = \'' + sanitize(obj.email) + '\'' +
      ' WHERE pid = ' + obj.playerId + ';';
  }
  simpleQuery(queryString, res);
}); 

app.get('*', function(req, res) {
  // load the single view file (angular will handle the page changes on the front-end)
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

var certsPath = path.join(__dirname, 'certs', 'server');

// SSL Certificates
var key = fs.readFileSync(path.join(certsPath, 'my-server.key.pem'));
var cert = fs.readFileSync(path.join(certsPath, 'comp307_davidzhou_ca.crt'));

var credentials = {key: key, cert: cert};

http.createServer(app).listen(8000);
console.log('Server Started at port 8000');

https.createServer(credentials, app).listen(443);
console.log('Secure Server Started at port 443');  

/*var server = app.listen(8000, function(){
    console.log('Server Started at port 8000');  
});*/
process.on('SIGTERM', function(){
    process.exit();
});
