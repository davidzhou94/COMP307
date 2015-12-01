/*
 * This module contains the definitions for all the routes used by the applications i.e GET/POST.
 * The actual handling of the requests are carried out by the API module which also contains all
 * the SQL query strings.
 */

(function() {
  var api = require('./api');
  var path = require('path');
  
  module.exports = function(app, auth, passport) {
    app.get('/api/getActorsByLeague/:leagueId', 
      auth.check,
      api.getActorsByLeague
    );

    app.get('/api/getActionsByLeague/:leagueId', 
      auth.check,
      api.getActionsByLeague
    );

    app.get('/api/getTeamsByLeague/:leagueId', 
      auth.check,
      api.getTeamsByLeague
    );

    app.get('/api/getLeaguesByPlayer/:playerId', 
      auth.check, 
      api.getLeaguesByPlayer
    );

    app.get('/api/getAvailableLeaguesByPlayer/:playerId', 
      auth.check,
      api.getAvailableLeaguesByPlayer
    );

    app.get('/api/getLeagueOwner/:leagueId', 
      auth.check,
      api.getLeagueOwner
    );

    app.get('/api/getTeamOwner/:teamId', 
      auth.check,
      api.getTeamOwner
    );

    app.get('/api/getPlayer/:playerId', 
      auth.check,
      api.getPlayer
    );

    app.get('/api/checkAuthenticated/', 
      auth.checkAuthenticated
    );

    app.get('/api/getDraftsByTeam/:teamId', 
      auth.check,
      api.getDraftsByTeam
    );

    app.get('/api/getAvailablePicksByTeam/:teamId', 
      auth.check,
      api.getAvailablePicksByTeam
    );

    app.get('/api/getDraftsByLeague/:leagueId', 
      auth.check,
      api.getDraftsByLeague
    );

    app.post('/api/addDraftedRule', 
      auth.check,
      api.addDraftedRule
    );

    app.post('/api/removeDraftedRule', 
      auth.check,
      api.removeDraftedRule
    );

    app.post('/api/setFulfilledCount/', 
      auth.check,
      api.setFulfilledCount
    );

    app.post('/api/addActor', 
      auth.check,
      api.addActor
    );

    app.post('/api/removeActor', 
      auth.check,
      api.removeActor
    );

    app.post('/api/addAction', 
      auth.check,
      api.addAction
    );

    app.post('/api/removeAction', 
      auth.check,
      api.removeAction
    );

    app.post('/api/addPlayer', 
      auth.check,
      api.addPlayer
    );

    app.post('/api/addTeam', 
      auth.check,
      api.addTeam
    );

    app.post('/api/addLeague', 
      auth.check,
      api.addLeague
    );

    app.post('/api/updatePlayer', 
      auth.check,
      api.updatePlayer
    );
    
    app.post('/api/login', 
      passport.authenticate('local-login'),
      auth.login
    );

    app.get('/api/logout',
      auth.logout
    );

    app.get('*', function(req, res) {
      // load the single view file (angular will handle the page changes on the front-end)
      res.sendFile(path.join(__dirname, './public', 'index.html'));
    });
  }
}());