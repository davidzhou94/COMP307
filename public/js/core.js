// declare a module
var fantasyControllers = angular.module('fantasyControllers', []);

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {
    // when landing on the page, get all teams for the given league and show them
    $http.get('/api/teams/' + $routeParams.leagueid)
      .then(function(response) {
        $scope.teams = response.data;
        console.log(response.data);
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
}]);

fantasyControllers.controller('homeController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {
    // when landing on the page, get all leagues for the given player and show them
    $http.get('/api/leagues/' + $routeParams.playerid)
      .then(function(response) {
        $scope.leagues = response.data;
        console.log(response.data);
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
}]);

fantasyControllers.controller('loginController', ['$scope', '$http', '$location', 
  function ($scope, $http, $location) {
    $scope.loginResult = "";
    $scope.login = function(){
      $http.post('/api/login', JSON.stringify($scope.loginCredentials))
        .then(function(response) {
          if(response.data.pid < 0){
            $scope.loginResult = "Login Failed";
          }else{
            $location.path('/home/' + response.data.pid); 
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
}]);

fantasyControllers.controller('teamController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {
    // when landing on the page, get all drafts for the given team and show them
    $http.get('/api/drafts/' + $routeParams.teamid)
      .then(function(response) {
        $scope.drafts = response.data;
        console.log(response.data);
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
}]);

var fantasyApp = angular.module('fantasyApp', [
  'ngRoute',
  'fantasyControllers'
]);

fantasyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/team/:teamid', {
        templateUrl : 'partials/team.html',
        controller : 'teamController'
      }).
      when('/league/:leagueid', {
        templateUrl : 'partials/league.html',
        controller : 'leagueController'
      }).
      when('/home/:playerid', {
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