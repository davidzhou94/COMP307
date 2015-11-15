var http = require('http');
var express = require('express');
var app = express();
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var path = require('path');

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

app.get('/api/teams/:league', function(req, res) {
  // hardcoded list of teams for now
  var gameid = req.params.league;
  if (gameid == 1) {
    res.json(
    [
      {id : 1, text : "Team Mr. Poopybutthole"},
      {id : 2, text : "Team Mr. Meeseeks"}
    ]);
  } else {
    res.json(
    [
      {id : 1, text : "Team Morty"},
      {id : 2, text : "Team Rick"},
      {id : 3, text : "Team Summer"},
      (id : 4, text : "Team Beth"},
      {id : 5, text : "Team Jerry AKA Why do I have to be last!?!"}
    ]);
  }
});

app.get('/api/leagues', function(req, res) {
  // hardcoded list of leagues for now
  res.json(
  [
    {id : 1, text : "League 1"},
    {id : 2, text : "League 2"}
  ]);
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
