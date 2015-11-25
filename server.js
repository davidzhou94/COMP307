var http = require('http');
var express = require('express');
var app = express();
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var path = require('path');
var mysql = require('mysql');

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

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

app.get('/api/getActorsByLeague/:leagueId', function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getActionsByLeague/:leagueId', function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM action' + 
    ' WHERE action.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getTeamsByLeague/:leagueId', function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT t.tid, t.team_name, p.username, t.total_points ' +
    '  FROM v_f_team AS t' + 
    '  LEFT JOIN player AS p' +
    '    ON t.player_id = p.pid' +
    ' WHERE t.lid= ' + leagueId + ';';
  simpleQuery(queryString, res);
});

app.get('/api/getLeaguesByPlayer/:playerId', function(req, res) {
  var playerId = req.params.playerId;
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

app.get('/api/getLeagueOwner/:leagueId', function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT f_league.owner_id' +
    '  FROM f_league' +
    ' WHERE f_league.lid = ' + leagueId + ';';
  singleRowQuery(queryString, res);
});

app.get('/api/getTeamOwner/:teamId', function(req, res) {
  var teamId = req.params.teamId;
  var queryString = 
    'SELECT f_team.player_id' +
    '  FROM f_team' +
    ' WHERE f_team.tid = ' + teamId + ';';
  singleRowQuery(queryString, res);
});

app.post('/api/login', function(req, res){
  var loginObj = req.body;
  var queryString = 
    'SELECT pid, username' +
    '  FROM player ' + 
    ' WHERE username = \'' + loginObj.username + '\'' +
    '   AND password = \'' + loginObj.password + '\';';
  singleRowQuery(queryString, res);
});

app.get('/api/getDraftsByTeam/:teamId', function(req, res) {
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

app.get('/api/getAvailablePicksByTeam/:teamId', function(req, res) {
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

app.get('/api/getDraftsByLeague/:leagueId', function(req, res) {
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

app.post('/api/addDraftedRule', function(req, res){
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

app.post('/api/removeDraftedRule', function(req, res){
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

app.post('/api/setFulfilledCount/', function(req, res){
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

app.post('/api/addActor', function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO actor(description, f_league_id, managed_actor_id)' +
    'VALUES (\'' + obj.description + '\', ' + obj.leagueId + ', ' + obj.managedActorId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      if(rows.affectedRows > 0){
        var queryString = 
          'SELECT *' +
          '  FROM actor' +
          ' WHERE actor.actor_id = ' + rows.insertId;
        singleRowQuery(queryString, res);
      } else {
        res.json(null);
      }
      
      connection.release
    });
  });
});

app.post('/api/removeActor', function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM actor' +
    ' WHERE actor.actor_id = ' + obj.actor + ';';
  simpleQuery(queryString, res);
});

app.post('/api/addAction', function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO action(description, points, f_league_id, managed_action_id)' +
    'VALUES (\'' + obj.description + '\', ' + obj.points + ', ' + obj.leagueId + ', ' + obj.managedActionId + ');';
  getConnection(function(connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      if(rows.affectedRows > 0){
        var queryString = 
          'SELECT *' +
          '  FROM action' +
          ' WHERE action.action_id = ' + rows.insertId;
        singleRowQuery(queryString, res);
      } else {
        res.json(null);
      }
      
      connection.release
    });
  });
});

app.post('/api/removeAction', function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM action' +
    ' WHERE action.action_id = ' + obj.action + ';';
  simpleQuery(queryString, res);
});

app.get('*', function(req, res) {
  // load the single view file (angular will handle the page changes on the front-end)
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

var server = app.listen(80, function(){
    console.log('Server Started at port 80');  
});
process.on('SIGTERM', function(){
    process.exit();
});
