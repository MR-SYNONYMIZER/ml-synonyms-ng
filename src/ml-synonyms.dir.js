(function() {

  'use strict';

  angular.module('ml.synonyms')
    .directive('mlSynonyms', mlSynonymsDirective);

  mlSynonymsDirective.$inject = [];

  function mlSynonymsDirective() {
    return {
      restrict: 'E',
      scope: {
        synonyms: '=',
        data: '=?',
        fromSuggestions: '=?',
        toSuggestions: '=?',

        addSynonym: '&?',
        removeSynonym: '&?',

        fromLabel: '@?',
        toLabel: '@?',

        template: '@'
      },
      templateUrl: template,
      link: function($scope, $element, $attrs) {
        $scope.fromLabel = $scope.fromLabel || 'From';
        $scope.toLabel = $scope.toLabel || 'To';
      }
    };
  }

  function template(element, attrs) {
    return attrs.template || '/ml-synonyms-ng/ml-synonyms.html';
  }

}());
