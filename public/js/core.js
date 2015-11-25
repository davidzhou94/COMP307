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
    $http.get('/api/getTeamsByLeague/' + $routeParams.leagueid)
      .then(function(response) {
        $scope.teams = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getLeagueOwner/' + $routeParams.leagueid)
      .then(function(response) {
        if (response.data != "null") {
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
    $http.get('/api/getLeaguesByPlayer/' + $routeParams.playerid)
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
          if(response.data == "null"){
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
    $http.get('/api/getDraftsByTeam/' + $routeParams.teamid)
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
        $http.get('/api/getAvailablePicksByTeam/' + $routeParams.teamid)
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
    var leagueId = $routeParams.leagueId;
    $scope.leagueDrafts = [];
    $scope.actors = [];
    $scope.actions = [];

    $http.get('/api/getDraftsByLeague/' + leagueId)
      .then(function(response) {
        $scope.leagueDrafts = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getActorsByLeague/' + leagueId)
      .then(function(response) {
        $scope.actors = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getActionsByLeague/' + leagueId)
      .then(function(response) {
        $scope.actions = response.data;
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
      if ($scope.leagueDrafts[index].fulfilled > 0) {
        changeFulfilled($scope.leagueDrafts[index].participated_id, $scope.leagueDrafts[index].fulfilled - 1, index);
      }
    }
    
    $scope.removeActor = function(index) {
      $http.post('/api/removeActor/', JSON.stringify({
        actor : $scope.actors[index].actor_id
      }))
        .then(function(response) {
          if (response.data.affectedRows > 0) {
            $scope.actors.splice(index, 1);
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.addActor = function() {
      $http.post('/api/addActor/', JSON.stringify({
        description : $scope.newActor.description,
        leagueId : leagueId,
        managedActorId : null
      }))
        .then(function(response) {
          if (response.data != "null") {
            $scope.actors.push(response.data);
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.removeAction = function(index) {
      $http.post('/api/removeAction/', JSON.stringify({
        action : $scope.actions[index].action_id
      }))
        .then(function(response) {
          if (response.data.affectedRows > 0) {
            $scope.actions.splice(index, 1);
          }
        },
        function(data) {
          console.log('Error: ' + data);
        });
    }
    
    $scope.addAction = function() {
      $http.post('/api/addAction/', JSON.stringify({
        description : $scope.newAction.description,
        points : $scope.newAction.points,
        leagueId : leagueId,
        managedActionId : null
      }))
        .then(function(response) {
          if (response.data != null) {
            $scope.actions.push(response.data);
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