var http = require('http');
var express = require('express');
var app = express();
app.use(express.static('public'));

var server = app.listen(8000, function(){
    console.log('Server Started at port 8000');  
});
process.on('SIGTERM', function(){
    process.exit();
});
