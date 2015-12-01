USE db;

DELETE FROM
player;
DELETE FROM
f_league;
DELETE FROM
f_team;
DELETE FROM
actor;
DELETE FROM
action;
DELETE FROM
drafted_rule;

INSERT INTO player (pid, username, password, email)
VALUES
(1, 'rick', 'rick', 'rick@rick.com'),
(2, 'morty', 'morty', 'morty@rick.com'),
(3, 'summer', 'summer', 'summer@rick.com'),
(4, 'Grady', 'password', 'Grady@davidzhou.ca'),
(5, 'Valerie', 'password', 'Valerie@davidzhou.ca'),
(6, 'David', 'password', 'info@davidzhou.ca'),
(7, 'Boustan', 'password', 'Boustan@davidzhou.ca'),
(8, 'Basha', 'password', 'Basha@davidzhou.ca'),
(9, 'Vihns', 'password', 'Vihns@davidzhou.ca'),
(10, 'Vua', 'password', 'Vua@davidzhou.ca'),
(11, 'Samosa', 'password', 'Samosa@davidzhou.ca'),
(12, 'Pizza', 'password', 'Pizza@davidzhou.ca');

INSERT INTO f_league (lid, description, active, owner_id)
VALUES
(1, 'Rick & Morty characters', 1, 1),
(2, 'Our team', 1, 4),
(3, 'Food league', 1, 7);

INSERT INTO f_team (tid, team_name, player_id, lid)
VALUES
(1, 'Team Rick', 1, 1),
(2, 'Team Morty', 2, 1),
(3, 'Team Summer', 3, 1),
(4, 'Team Grady', 4, 2),
(5, 'Team Valerie', 5, 2),
(6, 'Team David', 6, 2),
(7, 'Team Boustan', 7, 3),
(8, 'Team Basha', 8, 3),
(9, 'Team Vinhs', 9, 3),
(10, 'Team Vua', 10, 3),
(11, 'Team Samosa', 11, 3),
(12, 'Team Pizza', 12, 3);

INSERT INTO actor (actor_id, description, f_league_id)
VALUES
(1, 'Gazorpazorp', 1),
(2, 'Shrimply Pibbles', 1),
(3, 'Assignment 1', 2),
(4, 'Assignment 2', 2),
(5, 'Delivery person', 3),
(6, 'Cashier', 3),
(7, 'Phone order agent', 3),
(8, 'Shawarma slicing person', 3);

INSERT INTO action (action_id, description, points, f_league_id)
VALUES
(1, 'Appears in episode 1', 1.0, 1),
(2, 'Appears in episode 2', 1.0, 1),
(3, 'Appears in episode 3', 1.0, 1),
(4, 'Appears in episode 4', 1.0, 1),
(5, 'receives between 60 and 69%', 1.0, 2),
(6, 'receives between 70 and 79%', 0.5, 2),
(7, 'receives between 80 and 89%', 0.5, 2),
(8, 'receives between 90 and 99%', 1.0, 2),
(9, 'Gets the order wrong', 1.0, 3),
(10, 'Gives you extra', 2.0, 3),
(11, 'Is fast', 1.0, 3),
(12, 'Asks you how you are doing', 2.0, 3);

INSERT INTO drafted_rule (participated_id, actor_id, action_id, fulfilled, f_team_id)
VALUES
(1, 1, 1, 0, 1),
(2, 2, 1, 0, 1);