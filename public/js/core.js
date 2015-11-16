// declare a module
var fantasyControllers = angular.module('fantasyControllers', []);

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {

    // when landing on the page, get all teams and show them
    $http.get('/api/teams/' + $routeParams.leagueid)
      .then(function(data) {
        $scope.teams = data;
        console.log(data);
      },
      function(data) {
        console.log('Error: ' + data);
      });
}]);

fantasyControllers.controller('homeController', ['$scope', '$http', '$location', 
  function ($scope, $http, $location) {

    // when landing on the page, get all teams and show them
    $http.get('/api/leagues')
      .then(function(data) {
        $scope.leagues = data;
        console.log(data);
      },
      function(data) {
        console.log('Error: ' + data);
      });
}]);

fantasyControllers.controller('loginController', ['$scope', '$http', '$location', 
  function ($scope, $http, $location) {
    $scope.login = function(){
      $http.post('/api/login', JSON.stringify($scope.loginCredentials))
        .then(function(data) {
          
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
}]);

var fantasyApp = angular.module('fantasyApp', [
  'ngRoute',
  'fantasyControllers'
]);

fantasyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/team', {
        templateUrl : 'partials/team.html',
        controller : 'teamController'
      }).
      when('/league/:leagueid', {
        templateUrl : 'partials/league.html',
        controller : 'leagueController'
      }).
      when('/home', {
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
  }
]);