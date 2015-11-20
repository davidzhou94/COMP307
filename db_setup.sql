# created a database named 'db', and 'testuser' with password 'password'.
# links for reference/replication: https://www.linode.com/docs/databases/mysql/how-to-install-mysql-on-ubuntu-14-04
USE db;

DROP TABLE IF EXISTS
player, f_league, f_team, managed_actor, managed_action, actor, action, managed_rule, drafted_rule;

CREATE TABLE player
(
	pid 				INTEGER 		AUTO_INCREMENT PRIMARY KEY,
	username 			VARCHAR(50)		NOT NULL,
	password 			VARCHAR(50)		NOT NULL,
	email 				VARCHAR(50)		NOT NULL
);
CREATE TABLE f_league
(
	lid 				INTEGER 		AUTO_INCREMENT PRIMARY KEY,
	description 		TEXT			NULL,
	active				TINYINT(1)		,
	owner_id			INTEGER			NOT NULL REFERENCES player(pid)
);
CREATE TABLE f_team
(
	tid 				INTEGER 		AUTO_INCREMENT PRIMARY KEY,
	team_name 			VARCHAR(100)	NOT NULL,
	player_id 			INTEGER			REFERENCES player(pid),
	lid 				INTEGER			NOT NULL REFERENCES f_league(lid)
);
CREATE TABLE managed_actor
(
	m_actor_id 			INTEGER			AUTO_INCREMENT PRIMARY KEY,
	description 		TEXT			NULL
);
CREATE TABLE managed_action
(
	m_action_id 		INTEGER		AUTO_INCREMENT PRIMARY KEY,
	description 		TEXT		NULL,
	points 				DECIMAL		
);
CREATE TABLE actor
(
	actor_id			INTEGER		AUTO_INCREMENT PRIMARY KEY,
	description			TEXT		NULL,
	f_league_id			INTEGER		REFERENCES f_league(lid),
	managed_actor_id 	INTEGER		REFERENCES managed_actor(m_actor_id)
);
CREATE TABLE action 
(
	action_id			INTEGER		AUTO_INCREMENT PRIMARY KEY,
	description 		TEXT		NULL,
	points				DECIMAL		,
	f_league_id 		INTEGER		REFERENCES f_league(lid),
	managed_action_id 	INTEGER		REFERENCES managed_action(m_action_id)
);
CREATE TABLE managed_rule
(
	m_rid 				INTEGER		AUTO_INCREMENT PRIMARY KEY,
	managed_actor_id 	INTEGER		REFERENCES managed_actor(m_actor_id),
	managed_action_id 	INTEGER		REFERENCES managed_action(m_action_id),
	fulfilled 			INTEGER
);
CREATE TABLE drafted_rule
(
	participated_id		INTEGER		AUTO_INCREMENT PRIMARY KEY,
	actor_id 			INTEGER		REFERENCES actor(actor_id),
	action_id 			INTEGER		REFERENCES action(action_id),
	fulfilled 			INTEGER		,
	managed_rule_id 	INTEGER		REFERENCES managed_rule(m_rid),
  f_team_id       INTEGER   REFERENCES f_team(tid)
);