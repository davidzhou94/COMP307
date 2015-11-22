// declare a module
var fantasyControllers = angular.module('fantasyControllers', []);

fantasyControllers.factory('userInfo', function() {
    var userInfo = {
      playerId : null,
      username : null,
    }
    
    return userInfo;
});

fantasyControllers.controller('defaultController', ['$scope', 'userInfo',
  function ($scope, userInfo) {
    $scope.userInfo = userInfo;
}]);

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    // when landing on the page, get all teams for the given league and show them
    $http.get('/api/teams/' + $routeParams.leagueid)
      .then(function(response) {
        $scope.teams = response.data;
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
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
}]);

fantasyControllers.controller('loginController', ['$scope', '$http', '$location', 'userInfo',
  function ($scope, $http, $location, userInfo) {
    $scope.loginResult = "";
    $scope.login = function(){
      $http.post('/api/login', JSON.stringify($scope.loginCredentials))
        .then(function(response) {
          if(response.data.pid < 0){
            $scope.loginResult = "Login Failed";
          }else{
            userInfo.playerId = response.data.pid;
            userInfo.username = response.data.username;
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
    $scope.selectedDrafts = [];
    $scope.availableDrafts = [];
    // when landing on the page, get all drafts for the given team and show them

    $http.get('/api/drafts/' + $routeParams.teamid)
      .then(function(response) {
        $scope.selectedDrafts = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });

    $scope.load = function(show) {
      if (show) {
        $http.get('/api/availablepicks/' + $routeParams.teamid)
          .then(function(response) {
            $scope.availableDrafts = response.data;
          },
          function(response) {
            console.log('Error: ' + response.data);
          });
      }
    }
    
    $scope.draftpick = function(action, actor, index) {
      $http.post('/api/draftpick', JSON.stringify({
          action : action, 
          actor : actor, 
          team : $routeParams.teamid
        }))
        .then(function(response) {
          if (response.data.affectedRows > 0) {
            if (action === null) {
              i = $scope.availableDrafts.length - 1;
              while (i >= 0) {
                if ($scope.availableDrafts[i].actor_id === actor) {
                  $scope.availableDrafts[i].fulfilled = 0;
                  $scope.selectedDrafts.push($scope.availableDrafts[i]);
                  $scope.availableDrafts.splice(i, 1);
                }
                i -= 1;
              }
            } else {
              $scope.availableDrafts[index].fulfilled = 0;
              $scope.selectedDrafts.push($scope.availableDrafts[index]);
              $scope.availableDrafts.splice(index, 1);
            }
          }
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