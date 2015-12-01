(function() {
  var fs = require('fs');
  var path = require('path');

  var certsPath = path.join(__dirname, 'certs', 'server');

  // SSL Certificates
  var key = fs.readFileSync(path.join(certsPath, 'my-server.key.pem'));
  var cert = fs.readFileSync(path.join(certsPath, 'comp307_davidzhou_ca.crt'));

  module.exports.credentials = {key: key, cert: cert};
}());