/*
 * This module contains the logic for handling requests and the SQL queries used.
 */

'use strict';

var db = require('./database');
var utils = require('./utils');

var simpleQuery = function (queryString, res) {
  db.simpleQuery(queryString, function(result) {
    res.json(result);
  });
}

var singleRowQuery = function (queryString, res) {
  db.simpleQuery(queryString, function(result) {
    if(result.length > 0){
      res.json(result[0]);
    } else {
      res.json(null);
    }
  });
}

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActionsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM action' + 
    ' WHERE action.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getTeamsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT t.tid, t.team_name, p.username, t.total_points ' +
    '  FROM v_f_team AS t' + 
    '  LEFT JOIN player AS p' +
    '    ON t.player_id = p.pid' +
    ' WHERE t.lid= ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getLeaguesByPlayer = function(req, res) {
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
};

exports.getAvailableLeaguesByPlayer = function(req, res) {
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
};

exports.getLeagueOwner = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT f_league.owner_id' +
    '  FROM f_league' +
    ' WHERE f_league.lid = ' + leagueId + ';';
  singleRowQuery(queryString, res);
};

exports.getTeamOwner = function(req, res) {
  var teamId = req.params.teamId;
  var queryString = 
    'SELECT f_team.player_id' +
    '  FROM f_team' +
    ' WHERE f_team.tid = ' + teamId + ';';
  singleRowQuery(queryString, res);
};

exports.getPlayer = function(req, res) {
  var playerId = req.params.playerId;
  if (req.user.pid != playerId) {
    return res.sendStatus(401);
  }
  var queryString = 
    'SELECT pid, username, email' +
    '  FROM player' + 
    ' WHERE pid = ' + playerId + ';';
  singleRowQuery(queryString, res);
};

exports.getDraftsByTeam = function(req, res) {
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
};

exports.getAvailablePicksByTeam = function(req, res) {
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
};

exports.getDraftsByLeague = function(req, res) {
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
};

exports.addDraftedRule = function(req, res){
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
};


exports.removeDraftedRule = function(req, res){
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
};

exports.setFulfilledCount = function(req, res){
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
};

exports.addActor = function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO actor(description, f_league_id, managed_actor_id)' +
    'VALUES (\'' + utils.sanitize(obj.description) + '\', ' + obj.leagueId + ', ' + obj.managedActorId + ');';
  db.getConnection(function(connection) {
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
};

exports.removeActor = function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM actor' +
    ' WHERE actor.actor_id = ' + obj.actor + ';';
  simpleQuery(queryString, res);
};

exports.addAction = function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO action(description, points, f_league_id, managed_action_id)' +
    'VALUES (\'' + utils.sanitize(obj.description) + '\', ' + obj.points + ', ' + obj.leagueId + ', ' + obj.managedActionId + ');';
  db.getConnection(function(connection) {
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
};

exports.removeAction = function(req, res){
  var obj = req.body;
  var queryString = 
    'DELETE FROM action' +
    ' WHERE action.action_id = ' + obj.action + ';';
  simpleQuery(queryString, res);
};

exports.addPlayer = function(req, res){
  if (req.isAuthenticated()){
    return res.json(null);
  }
  var obj = req.body;
  var queryString =
    'INSERT INTO player(username, password, email)' +
    'VALUES (\'' + utils.sanitize(obj.username) + '\', \'' + utils.sanitize(obj.password) + '\', \'' + utils.sanitize(obj.email) + '\');';
  db.getConnection(function(connection) {
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
};

exports.addTeam = function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO f_team(team_name, player_id, lid)' +
    'VALUES (\'' + utils.sanitize(obj.teamName) + '\', ' + obj.playerId + ', ' + obj.leagueId + ');';
  db.getConnection(function(connection) {
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
};

exports.addLeague = function(req, res){
  var obj = req.body;
  var queryString =
    'INSERT INTO f_league(description, active, owner_id)' +
    'VALUES (\'' + utils.sanitize(obj.leagueName) + '\', 1, ' + obj.ownerId + ');';
  db.getConnection(function(connection) {
    connection.query(queryString, function(err, result, fields) {
      if (err){
        console.log("Query error: " + err);
        res.json(null)
      } else {
        if(result.affectedRows > 0){
          var queryString = 
            'INSERT INTO f_team(team_name, player_id, lid)' +
            'VALUES (\'' + utils.sanitize(obj.teamName) + '\', ' + obj.ownerId + ', ' + result.insertId + ');';
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
};

exports.updatePlayer = function(req, res){
  var obj = req.body;
  if (req.user.pid != obj.playerId) {
    return res.sendStatus(401);
  }
  var queryString;
  if (obj.password === '') {
    queryString =
      'UPDATE player' +
      '   SET username = \'' + utils.sanitize(obj.username) + '\',' +
      '       email = \'' + utils.sanitize(obj.email) + '\'' +
      ' WHERE pid = ' + obj.playerId + ';';
  } else {
    queryString =
      'UPDATE player' +
      '   SET username = \'' + utils.sanitize(obj.username) + '\',' +
      '       password = \'' + utils.sanitize(obj.password) + '\',' +
      '       email = \'' + utils.sanitize(obj.email) + '\'' +
      ' WHERE pid = ' + obj.playerId + ';';
  }
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};

exports.getActorsByLeague = function(req, res) {
  var leagueId = req.params.leagueId;
  var queryString = 
    'SELECT * ' +
    '  FROM actor' + 
    ' WHERE actor.f_league_id = ' + leagueId + ';';
  simpleQuery(queryString, res);
};