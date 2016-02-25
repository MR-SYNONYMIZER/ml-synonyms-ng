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
        addSynonym: '&?',
        removeSynonym: '&?',
        fromLabel: '@?',
        toLabel: '@?'
      },
      templateUrl: '/ml-synonyms-ng/ml-synonyms.html',
      link: function($scope, $element, $attrs) {
        $scope.fromLabel = $scope.fromLabel || 'From';
        $scope.toLabel = $scope.toLabel || 'To';
      }
    };
  }

}());
