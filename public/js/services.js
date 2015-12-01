'use strict';

var fantasyServices = angular.module('fantasyServices', []);

// for password validation.
// http://odetocode.com/blogs/scott/archive/2014/10/13/confirm-password-validation-in-angularjs.aspx
fantasyServices.directive("compareTo", function() {
  return {
    require: "ngModel",
    scope: {
      otherModelValue: "=compareTo"
    },
    link: function(scope, element, attributes, ngModel) {
      ngModel.$validators.compareTo = function(modelValue) {
        return modelValue == scope.otherModelValue;
      };
      scope.$watch("otherModelValue", function() {
        ngModel.$validate();
      });
    }
  };
});

fantasyServices.factory('userService', function() {
  var userService = {
    playerId : null,
    username : null,
    clear : clear
  }
  
  function clear() {
    userService.playerId = null;
    userService.username = null;
  }
  
  return userService;
});

fantasyServices.factory('alertService', function() {
  var service = {
    add: add,
    append: append,
    closeAlert: closeAlert,
    closeAlertIdx: closeAlertIdx,
    clear: clear,
    get: get
  },
  alerts = [];

  return service;

  function append(type, msg) {
    return alerts.push({
      type: type,
      msg: msg,
      close: function() {
        return closeAlert(this);
      }
    });
  }
  
  function add(type, msg) {
    alerts.length = 0;
    return alerts.push({
      type: type,
      msg: msg,
      close: function() {
        return closeAlert(this);
      }
    });
  }

  function closeAlert(alert) {
    return closeAlertIdx(alerts.indexOf(alert));
  }

  function closeAlertIdx(index) {
    return alerts.splice(index, 1);
  }

  function clear(){
    alerts.length = 0;
  }

  function get() {
    return alerts;
  }
});

fantasyServices.factory('menuService', function() {
  var menuService = {
    add : add,
    clear : clear,
    get : get
  }
  
  var menuItems = [];
  
  return menuService;
  
  function add(item) {
    return menuItems.push({
      href : item.href,
      action : item.action,
      text : item.text
    });
  }
  
  function clear() {
    return menuItems.length = 0;
  }
  
  function get() {
    return menuItems;
  }
});