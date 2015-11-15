// declare a module
var fantasyControllers = angular.module('fantasyControllers', []);

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {
    $scope.formData = {};

    // when landing on the page, get all teams and show them
    $http.get('/api/teams/' + $routeParams.leagueid)
      .success(function(data) {
        $scope.teams = data;
        console.log(data);
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
}]);

fantasyControllers.controller('homeController', ['$scope', '$http', '$location', 
  function ($scope, $http, $location) {
    $scope.formData = {};

    // when landing on the page, get all teams and show them
    $http.get('/api/leagues')
      .success(function(data) {
        $scope.leagues = data;
        console.log(data);
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
}]);

var fantasyApp = angular.module('fantasyApp', [
  'ngRoute',
  'fantasyControllers'
]);

fantasyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/team', {
        templateUrl : 'team.html',
        controller : 'teamController'
      }).
      when('/league/:leagueid', {
        templateUrl : 'league.html',
        controller : 'leagueController'
      }).
      when('/home', {
        templateUrl : 'home.html',
        controller : 'homeController'
      }).
      otherwise({
        redirectTo : '/home'
      });
  }
]);