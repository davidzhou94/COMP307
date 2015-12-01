(function() {
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
        console.log("[CRITICAL] Connection error: " + err);
      } else {
        callback(connection);
      }
    });
  };

  var simpleQuery = function(queryString, done) {
    getConnection(function(connection) {
      connection.query(queryString, function(err, result, fields) {
        if (err) {
          console.log("[CRITICAL] Query error: " + err);
          done(null);
        } else {
          done(result);
        }
      });

      connection.release();
    });
  }
  
  module.exports.getConnection = getConnection;
  module.exports.simpleQuery = simpleQuery;
}());