'use strict';

var fantasyApp = angular.module('fantasyApp', [
  'ngRoute',
  'ngAnimate',
  'ngResource',
  'ui.bootstrap',
  'fantasyControllers',
  'fantasyServices'
]);

fantasyApp.config(['$routeProvider', '$httpProvider',
  function($routeProvider, $httpProvider) {
    $routeProvider.
      when('/account/', {
        templateUrl : 'partials/account.html',
        controller : 'accountController'
      }).
      when('/joinLeague/', {
        templateUrl : 'partials/join-league.html',
        controller : 'joinLeagueController'
      }).
      when('/manageLeague/:leagueId', {
        templateUrl : 'partials/manage-league.html',
        controller : 'manageLeagueController'
      }).
      when('/team/:teamId', {
        templateUrl : 'partials/team.html',
        controller : 'teamController'
      }).
      when('/league/:leagueId', {
        templateUrl : 'partials/league.html',
        controller : 'leagueController'
      }).
      when('/home/:playerId', {
        templateUrl : 'partials/home.html',
        controller : 'homeController'
      }).
      when('/login', {
        templateUrl : 'partials/login.html',
        controller : 'loginController'
      }).
      otherwise({
        redirectTo : '/login'
      });
    $httpProvider.interceptors.push(function($q, $location) {
      return {
        response: function(response) {
          // do something on success
          return response;
        },
        responseError: function(response) {
          if (response.status === 401)
            $location.url('/login');
          return $q.reject(response);
        }
      };
    });
  }
]);