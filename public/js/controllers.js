'use strict';

var fantasyControllers = angular.module('fantasyControllers', []);

fantasyControllers.controller('defaultController', ['$scope', '$http', '$location', '$route', 'userService', 'alertService', 'menuService',
  function ($scope, $http, $location, $route, userService, alertService, menuService) {
    $http.get('/api/checkAuthenticated')
      .then(function(response) {
        if (response.data) {
          userService.playerId = response.data.pid,
          userService.username = response.data.username
        }
      });
    $scope.userInfo = userService;
    $scope.alerts = alertService.get();
    $scope.menuItems = menuService.get();
    $scope.$on('$routeChangeStart', function(next, current) { 
      alertService.clear();
      menuService.clear();
    });
    $scope.logout = function() {
      $http.get('/api/logout/')
        .then(function(response) {
          userService.clear();
          menuService.clear();
          $location.path('/login/');
        });
    }
}]);

fantasyControllers.controller('leagueController', ['$scope', '$http', '$routeParams', 'userService', 'menuService',
  function ($scope, $http, $routeParams, userService, menuService) {
    // when landing on the page, get all teams for the given league and show them
    $scope.teams = [];
    $scope.isOwner = false;
    $scope.leagueId = $routeParams.leagueId;
    
    $http.get('/api/getTeamsByLeague/' + $routeParams.leagueId)
      .then(function(response) {
        $scope.teams = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getLeagueOwner/' + $routeParams.leagueId)
      .then(function(response) {
        if (response.data != null) {
          $scope.isOwner = (userService.playerId === response.data.owner_id);
          if ($scope.isOwner) {
            menuService.add({text : 'Manage League', href : '#/manageLeague/' + $routeParams.leagueId});
          }
        }
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
}]);

fantasyControllers.controller('homeController', ['$scope', '$http', '$routeParams', '$rootScope', '$location', '$uibModal', 'userService', 'menuService',
  function ($scope, $http, $routeParams, $rootScope, $location, $uibModal, userService, menuService) {
    // when landing on the page, get all leagues for the given player and show them
    $scope.userInfo = userService;
    $http.get('/api/getLeaguesForPlayer/')
      .then(function(response) {
        $scope.leagues = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
    
    function joinLeague() {
      if (userService.playerId > 0) {
        $location.path('/joinLeague/'); 
      }
    }
    
    var createLeague = function() {
      if (userService.playerId <= 0) {
        return; 
      }
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'partials/create-league-modal.html',
        controller: 'createLeagueModalController',
        resolve: {
          newLeague: {
            teamName : null,
            leagueName : null,
            ownerId : userService.playerId
          }
        }
      });

      modalInstance.result.then(function (newLeague) {
        $scope.newLeague = newLeague;
        $http.post('/api/addLeague/', JSON.stringify(newLeague))
          .then(function(response) {
            $location.path('/manageLeague/' + response.data.lid);
          },
          function(response) {
            console.log('Error: ' + response.data);
          });
      }, function () {
        console.log('Modal dismissed at: ' + new Date());
      });
    }
    
    menuService.add({text : 'Join League', action : joinLeague});
    menuService.add({text : 'Create New League', action : createLeague});
}]);

fantasyControllers.controller('loginController', ['$scope', '$http', '$location', 'userService', 'alertService', 
  function ($scope, $http, $location, userService, alertService) {
    $http.get('/api/checkAuthenticated')
      .then(function(response) {
        if (response.data) {
          $location.url('/home/');
        }
      });
  
    $scope.loginCredentials = {};
    $scope.newAccount = {};
    $scope.login = function() {
      $http.post('/api/login', JSON.stringify($scope.loginCredentials))
        .success(function(data) {
          if(data == null){
            alertService.add("danger", "Login Failed");
          }else{
            userService.playerId = data.pid;
            userService.username = data.username;
            $location.url('/home/'); 
          }
        })
        .error(function(data) {
          alertService.add("danger", "Login Failed");
          console.log('Error: ' + data);
        });
    };
    $scope.createAccount = function(isValid) {
      if (isValid) {
        $http.post('/api/addPlayer', JSON.stringify($scope.newAccount))
          .then(function(response) {
            if(response.data == null){
              alertService.add("danger", "Could not create account");
            }else{
              $scope.loginCredentials.username = $scope.newAccount.username;
              $scope.loginCredentials.password = $scope.newAccount.password;
              $scope.login();
            }
          },
          function(data) {
            console.log('Error: ' + data);
          });
      } else {
        alertService.add("danger", "Please correct the errors below.");
      }
    };
}]);

fantasyControllers.controller('teamController', ['$scope', '$http', '$routeParams', 'userService',
  function ($scope, $http, $routeParams, userService) {
    $scope.selectedDrafts = [];
    $scope.availableDrafts = [];
    $scope.isOwner = false;
    $scope.newPicksText = "+ Draft New Picks";
    
    // when landing on the page, get all drafts for the given team and show them
    $http.get('/api/getDraftsByTeam/' + $routeParams.teamId)
      .then(function(response) {
        $scope.selectedDrafts = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
      
    $http.get('/api/getTeamOwner/' + $routeParams.teamId)
      .then(function(response) {
        $scope.isOwner = (response.data.player_id === userService.playerId);
      },
      function(response) {
        console.log('Error: ' + response.data);
      });

    $scope.load = function(show) {
      if (show) {
        $scope.newPicksText = "- Draft New Picks";
        $http.get('/api/getAvailablePicksByTeam/' + $routeParams.teamId)
          .then(function(response) {
            $scope.availableDrafts = response.data;
          },
          function(response) {
            console.log('Error: ' + response.data);
          });
      } else {
        $scope.newPicksText = "+ Draft New Picks";
      }
    }
    
    $scope.addDraftPick = function(action, actor, index) {
      $http.post('/api/addDraftedRule', JSON.stringify({
          action : action, 
          actor : actor, 
          team : $routeParams.teamId
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
          team : $routeParams.teamId
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
    $scope.newActor = {};
    $scope.newAction = {};

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
          if (response.data != null) {
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

fantasyControllers.controller('joinLeagueController', ['$scope', '$http', '$location', '$uibModal', 'userService',
  function ($scope, $http, $location, $uibModal, userService) {
    $scope.userService = userService;
    // when landing on the page, get all leagues for the given player and show them
    $http.get('/api/getAvailableLeaguesForPlayer/')
      .then(function(response) {
        $scope.leagues = response.data;
      },
      function(response) {
        console.log('Error: ' + response.data);
      });
    $scope.joinLeague = function(index) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'partials/create-team-modal.html',
        controller: 'createTeamModalController',
        resolve: {
          newTeam: {
            teamName : null,
            leagueName : $scope.leagues[index].description,
            leagueId : $scope.leagues[index].lid,
            playerId : userService.playerId
          }
        }
      });

      modalInstance.result.then(function (newTeam) {
        $scope.newTeam = newTeam;
        $http.post('/api/addTeam/', JSON.stringify(newTeam))
          .then(function(response) {
            $location.path('/team/' + response.data.tid);
          },
          function(response) {
            console.log('Error: ' + response.data);
          });
      }, function () {
        console.log('Modal dismissed at: ' + new Date());
      });
    }
}]);

fantasyControllers.controller('createTeamModalController', ['$scope', '$uibModalInstance', 'newTeam',
  function ($scope, $uibModalInstance, newTeam) {
    $scope.newTeam = newTeam;

    $scope.ok = function () {
      $uibModalInstance.close($scope.newTeam);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
}]);

fantasyControllers.controller('createLeagueModalController', ['$scope', '$uibModalInstance', 'newLeague',
  function ($scope, $uibModalInstance, newLeague) {
    $scope.newLeague = newLeague;

    $scope.ok = function () {
      $uibModalInstance.close($scope.newLeague);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
}]);

fantasyControllers.controller('accountController', ['$scope', '$http', 'userService', 'alertService',
  function ($scope, $http, userService, alertService) {
    var original = { };
    $http.get('/api/getPlayer/')
      .then(function(response) {
        original = response.data;
        $scope.modified = {
          playerId : userService.playerId,
          username : original.username,
          email : original.email,
          password : '',
          confirmPassword : ''
        }
      },
      function(response) {
        console.log('Error: ' + response.data);
      });

    $scope.updateAccount = function (isValid) {
      if (isValid) {
        if ($scope.modified.email === original.email && 
            $scope.modified.username === original.username &&
            $scope.modified.password === '') {
          alertService.add("info", "No changes were made");
          return;
        }
        $http.post('/api/updatePlayer', JSON.stringify($scope.modified))
          .then(function(response) {
            if(response.data.affectedRows > 0){
              alertService.add("success", "Account information updated");
            }else{
              alertService.add("danger", "Failed to update account information");
              $scope.modified.email = original.email;
              $scope.modified.username = original.username;
              $scope.modified.password = '';
              $scope.modified.confirmPassword = '';
            }
          },
          function(data) {
            console.log('Error: ' + data);
          });
      } else {
        alertService.add("danger", "Please correct the errors below.");
      }
    }
}]);