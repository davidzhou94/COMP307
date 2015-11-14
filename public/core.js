// declare a module
var teamsModule = angular.module('teams', []);

function mainController($scope, $http) {
  $scope.formData = {};

  // when landing on the page, get all teams and show them
  $http.get('/api/teams')
    .success(function(data) {
      $scope.teams = data;
      console.log(data);
    })
    .error(function(data) {
      console.log('Error: ' + data);
    });
}