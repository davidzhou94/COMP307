# created a database named 'db', and 'testuser' with password 'password'.
# links for reference/replication: https://www.linode.com/docs/databases/mysql/how-to-install-mysql-on-ubuntu-14-04
USE db;

DROP TABLE IF EXISTS
player, f_league, f_team, managed_actor, managed_action, actor, action, managed_rule, drafted_rule;
DROP VIEW IF EXISTS
v_f_team;

CREATE TABLE player
(
  pid           INTEGER       AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  password      VARCHAR(50)   NOT NULL,
  email         VARCHAR(50)   NOT NULL
);
CREATE TABLE f_league
(
  lid           INTEGER       AUTO_INCREMENT PRIMARY KEY,
  description   VARCHAR(100)  NOT NULL UNIQUE,
  active        TINYINT(1)    NOT NULL DEFAULT 1,
  owner_id      INTEGER       NOT NULL REFERENCES player(pid)
);
CREATE TABLE f_team
(
  tid           INTEGER       AUTO_INCREMENT PRIMARY KEY,
  team_name     VARCHAR(100)  NOT NULL UNIQUE,
  player_id     INTEGER       NOT NULL REFERENCES player(pid),
  lid           INTEGER       NOT NULL REFERENCES f_league(lid)
);
CREATE TABLE managed_actor
(
  m_actor_id    INTEGER       AUTO_INCREMENT PRIMARY KEY,
  description   VARCHAR(100)  NOT NULL UNIQUE
);
CREATE TABLE managed_action
(
  m_action_id   INTEGER       AUTO_INCREMENT PRIMARY KEY,
  description   VARCHAR(100)  NOT NULL UNIQUE,
  points        DECIMAL       NOT NULL
);
CREATE TABLE actor
(
  actor_id      INTEGER       AUTO_INCREMENT PRIMARY KEY,
  description   VARCHAR(100)  NULL,
  f_league_id   INTEGER       NOT NULL REFERENCES f_league(lid),
  managed_actor_id  INTEGER   NULL REFERENCES managed_actor(m_actor_id),
  UNIQUE (description, f_league_id)
);
CREATE TABLE action 
(
  action_id     INTEGER       AUTO_INCREMENT PRIMARY KEY,
  description   VARCHAR(100)  NULL,
  points        DECIMAL       NOT NULL,
  f_league_id   INTEGER       NOT NULL REFERENCES f_league(lid),
  managed_action_id INTEGER   NULL REFERENCES managed_action(m_action_id),
  UNIQUE (description, f_league_id)
);
CREATE TABLE managed_rule
(
  m_rid         INTEGER       AUTO_INCREMENT PRIMARY KEY,
  managed_actor_id  INTEGER   NOT NULL REFERENCES managed_actor(m_actor_id),
  managed_action_id INTEGER   NOT NULL REFERENCES managed_action(m_action_id),
  fulfilled     INTEGER       NOT NULL,
  UNIQUE (managed_actor_id, managed_action_id)
);
CREATE TABLE drafted_rule
(
  participated_id INTEGER     AUTO_INCREMENT PRIMARY KEY,
  actor_id      INTEGER       NOT NULL REFERENCES actor(actor_id),
  action_id     INTEGER       NOT NULL REFERENCES action(action_id),
  fulfilled     INTEGER       NOT NULL,
  managed_rule_id INTEGER     NULL REFERENCES managed_rule(m_rid),
  f_team_id     INTEGER       NOT NULL REFERENCES f_team(tid),
  UNIQUE (actor_id, action_id)
);
CREATE VIEW v_f_team AS
SELECT f_team.tid,
       f_team.team_name,
       f_team.player_id,
       f_team.lid,
       SUM(drafted_rule.fulfilled * action.points) AS total_points
  FROM f_team
  LEFT JOIN drafted_rule
    ON f_team.tid = drafted_rule.f_team_id
  LEFT JOIN action
    ON drafted_rule.action_id = action.action_id
 GROUP BY f_team.tid;