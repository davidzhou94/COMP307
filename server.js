var http = require('http');
var express = require('express');
var app = express();
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

app.get('/api/teams', function(req, res) {
  // hardcoded list of todos for now
  res.json(
  [
    {id : 1, text : "Mr. Poopybutthole"},
    {id : 2, text : "Mr. Meeseeks"}
  ]);
});

app.get('*', function(req, res) {
  // load the single view file (angular will handle the page changes on the front-end)
  res.sendfile('./public/index.html');
});

var server = app.listen(8000, function(){
    console.log('Server Started at port 8000');  
});
process.on('SIGTERM', function(){
    process.exit();
});
