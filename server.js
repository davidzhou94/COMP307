var http = require('http');
var express = require('express');
var app = express();
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var path = require('path');
var mysql = require('mysql');

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
      console.log("Connection error: " + err);
    }
    callback(err, connection);
  });
};

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

app.get('/api/teams/:league', function(req, res) {
  // hardcoded list of teams for now
  var leagueid = req.params.league;
  var queryString = 'SELECT t.tid, t.team_name, p.username ' +
                    '  FROM f_team AS t' + 
                    '  LEFT JOIN player AS p' +
                    '    ON t.player_id = p.pid' +
                    ' WHERE t.lid=\'' + leagueid + '\';';
  console.log(queryString);
  getConnection(function(err, connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      console.log("Sending " + rows);
      res.json(rows);
    });

    connection.release();
  });
});

app.get('/api/leagues/:player', function(req, res) {
  var playerid = req.params.player;
  var queryString = 'SELECT l.lid, l.description, t.tid, t.team_name ' +
                    '  FROM f_team AS t' + 
                    '  LEFT JOIN f_league AS l' +
                    '    ON t.lid = l.lid' +
                    ' WHERE t.player_id=\'' + playerid + '\';';
  console.log(queryString);
  getConnection(function(err, connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      console.log("Sending " + rows);
      res.json(rows);
    });

    connection.release();
  });
});

app.post('/api/login', function(req, res){
  loginObj = req.body;
  var queryString = 'SELECT pid, username' +
                    '  FROM player ' + 
                    ' WHERE username=\'' + loginObj.username + '\'' +
                    '   AND password=\'' + loginObj.password + '\';';
  console.log(queryString);
  getConnection(function(err, connection) {
    var loginResult = false;
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      if(rows.length > 0){
        console.log("Sending loginResult = " + rows[0]);
        res.json(rows[0]);
      } else {
        res.json({pid : -1});
      }
    });

    connection.release();
  });
});

app.get('/api/drafts/:team', function(req, res) {
  var teamid = req.params.team;
  var queryString = 'SELECT d.participated_id, ' +
                    '       d.fulfilled, ' +
                    '       ar.description AS actor, ' +
                    '       ar.actor_id, ' +
                    '       an.description AS action, ' +
                    '       an.action_id, ' +
                    '       an.points' +
                    '  FROM drafted_rule AS d' + 
                    '  LEFT JOIN actor AS ar' +
                    '    ON d.actor_id = ar.actor_id' +
                    '  JOIN action AS an' +
                    '    ON d.action_id = an.action_id OR' +
                    '       d.action_id IS NULL' +
                    ' WHERE d.f_team_id=\'' + teamid + '\' AND' +
                    '       ar.f_league_id = an.f_league_id' +
                    ' ORDER BY d.participated_id;';
  console.log(queryString);
  getConnection(function(err, connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      console.log("Sending " + rows);
      res.json(rows);
    });

    connection.release();
  });
});

app.get('/api/availablepicks/:team', function(req, res) {
  var teamid = req.params.team;
  var queryString = 'SELECT ar.description AS actor, ' +
                    '       ar.actor_id, ' +
                    '       an.description AS action, ' +
                    '       an.action_id, ' +
                    '       an.points' +
                    '  FROM actor AS ar' +
                    '  JOIN action AS an' +
                    '  LEFT JOIN drafted_rule AS d' +
                    '    ON d.actor_id = ar.actor_id AND' +
                    '       ( d.action_id = an.action_id OR' +
                    '         d.action_id IS NULL)' +
                    '  LEFT JOIN f_team AS t' +
                    '    ON t.lid = ar.f_league_id' +
                    ' WHERE ar.f_league_id = t.lid AND' +
                    '       an.f_league_id = t.lid AND' +
                    '       t.tid = ' + teamid + ' AND' +
                    '       d.participated_id IS NULL' +
                    ' ORDER BY ar.actor_id;';
  console.log(queryString);
  getConnection(function(err, connection) {
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      console.log("Sending " + rows);
      res.json(rows);
    });

    connection.release();
  });
});

app.post('/api/draftpick', function(req, res){
  var obj = req.body;
  var queryString = 'INSERT INTO drafted_rule(action_id, actor_id, fulfilled, f_team_id)' +
                    'VALUES (' + obj.action + ', ' + obj.actor + ', 0, ' + obj.team + ')'
  console.log(queryString);
  getConnection(function(err, connection) {
    var loginResult = false;
    connection.query(queryString, function(err, rows, fields) {
      if (err){
        console.log("Query error: " + err);
      }
      console.log("Sending " + rows);
      res.json(rows);
    });

    connection.release();
  });
});

app.get('*', function(req, res) {
  // load the single view file (angular will handle the page changes on the front-end)
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

var server = app.listen(8000, function(){
    console.log('Server Started at port 8000');  
});
process.on('SIGTERM', function(){
    process.exit();
});
