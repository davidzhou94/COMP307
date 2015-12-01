// core imports for the application to work
var https = require('https');
var http = require('http');
var express = require('express');
var app = express();

// library imports
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

// our imports - most of our code is here.
var utils = require('./utils');
var auth = require('./auth');
var ssl = require('./ssl');

// some basic config
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users

// config related to sessions
app.use(cookieParser());
app.use(cookieSession({ 
  genid : function(req) { return utils.generateGUID },
  secret : 'wubbalubbadubdub',
  resave : true,
  saveUninitialized : true,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) }
}));

// passport related config
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);
passport.use('local-login', auth.localStrategy);

// set up routes - the rest of our code is here and in api.js 
// which is a module referenced by routes.js
require('./routes.js')(app, auth, passport);

// launch servers
http.createServer(app).listen(80);
console.log('Server Started at port 80');

https.createServer(ssl.credentials, app).listen(443);
console.log('Secure Server Started at port 443');  

process.on('SIGTERM', function(){
    process.exit();
});
