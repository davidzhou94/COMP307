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

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams', 'userInfo',
  function ($scope, $http, $routeParams, userInfo) {
    // when landing on the page, get all teams for the given league and show them
    $scope.teams = [];
    $scope.isOwner = false;
    $scope.leagueId = $routeParams.leagueid;
    $http.get('/api/teams/' + $routeParams.leagueid)
      .then(function(response) {
        $scope.teams = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getLeagueOwner/' + $routeParams.leagueid)
      .then(function(response) {
        if (response.data.owner_id >= 0) {
          $scope.isOwner = (userInfo.playerId === response.data.owner_id);
        }
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

fantasyControllers.controller('teamController', ['$scope', '$http', '$routeParams', 'userInfo',
  function ($scope, $http, $routeParams, userInfo) {
    $scope.selectedDrafts = [];
    $scope.availableDrafts = [];
    $scope.isOwner = false;
    
    // when landing on the page, get all drafts for the given team and show them
    $http.get('/api/drafts/' + $routeParams.teamid)
      .then(function(response) {
        $scope.selectedDrafts = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getTeamOwner/' + $routeParams.teamid)
      .then(function(response) {
        $scope.isOwner = (response.data.player_id === userInfo.playerId);
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
    
    $scope.addDraftPick = function(action, actor, index) {
      $http.post('/api/addDraftedRule', JSON.stringify({
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
    
    $scope.removeDraftPick = function(action, actor, index) {
      $http.post('/api/removeDraftedRule', JSON.stringify({
          action : action, 
          actor : actor, 
          team : $routeParams.teamid
        }))
        .then(function(response) {
          if (response.data.affectedRows > 0) {
            if (action === null) {
              i = $scope.selectedDrafts.length - 1;
              while (i >= 0) {
                if ($scope.selectedDrafts[i].actor_id === actor) {
                  $scope.availableDrafts.push($scope.selectedDrafts[i]);
                  $scope.selectedDrafts.splice(i, 1);
                }
                i -= 1;
              }
            } else {
              $scope.availableDrafts.push($scope.selectedDrafts[index]);
              $scope.selectedDrafts.splice(index, 1);
            }
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
}]);

fantasyControllers.controller('manageLeagueController', ['$scope', '$http', '$routeParams', 
  function ($scope, $http, $routeParams) {
    $scope.leagueDrafts = [];

    $http.get('/api/draftsByLeague/' + $routeParams.leagueId)
      .then(function(response) {
        $scope.leagueDrafts = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
    
    var changeFulfilled = function(draft, value, index) {
      $http.post('/api/setFulfilledCount', JSON.stringify({
          drafted_rule : draft, 
          fulfilled : value
        }))
        .then(function(response) {
          if (response.data.affectedRows > 0) {
            $scope.leagueDrafts[index].fulfilled = value;
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.increment = function(index) {
      changeFulfilled($scope.leagueDrafts[index].participated_id, $scope.leagueDrafts[index].fulfilled + 1, index);
    }
    $scope.decrement = function(index) {
      changeFulfilled($scope.leagueDrafts[index].participated_id, $scope.leagueDrafts[index].fulfilled - 1, index);
    }
}]);

var fantasyApp = angular.module('fantasyApp', [
  'ngRoute',
  'fantasyControllers'
]);

fantasyApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/manageLeague/:leagueId', {
        templateUrl : 'partials/manage-league.html',
        controller : 'manageLeagueController'
      }).
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