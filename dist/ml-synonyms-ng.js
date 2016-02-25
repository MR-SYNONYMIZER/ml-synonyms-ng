(function () {
  'use strict';

  angular.module('ml.synonyms', [
    'ml.common',
    'ml.synonyms.tpls'
  ]);
}());

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

(function () {
  'use strict';

  angular.module('ml.synonyms')
    .factory('MLSynonymsFactory', MLSynonymsFactory);

  MLSynonymsFactory.$inject = ['MLRest'];
  
  function MLSynonymsFactory(mlRest) {
    return {
      newSparqlService: function (options) {
        return new MLSynonymsSparqlService(mlRest, options);
      }
    };
  }
  
  function MLSynonymsSparqlService(mlRest, options) {
    var predicate = options && options.predicate || 'http://www.w3.org/2002/07/owl#sameAs';

    // Monkey-patching MLRest to extend its sparql support
    mlRest.sparqlUpdate = function (query, params) {
      params = params || {};

      return mlRest.request('/graphs/sparql', {
        method: 'POST',
        params: params,
        data: query,
        headers: {
          'Accept': 'application/sparql-results+json',
          'Content-Type': 'application/sparql-update'
        }
      });
    };

    mlRest.things = function (iri, params) {
      params = params || {};

      params.iri = iri;

      return mlRest.request('/graphs/things', {
        params: params,
        headers: {
          'Accept': 'application/n-triples'
        }
      });
    };

    function reformatBindings(bindings) {
      var result = {};
      angular.forEach(bindings, function(binding, index) {
        var from = binding.from.value;
        var to = binding.to.value;
        var direct = !!binding.direct;
        if (!result[from]) {
          result[from] = [];
        }
        result[from].push({ to: to, direct: direct });
      });
      return result;
    }

    function getSynonymsFromSparql() {
      /* jshint multistr: true */
      var query = '\
        SELECT DISTINCT ?from ?to ?direct \
        WHERE { \
          { ?from (<'+predicate+'>|^<'+predicate+'>)* ?to . \
            OPTIONAL { \
              ?from (<'+predicate+'>|^<'+predicate+'>) ?direct . \
              FILTER ( ?direct = ?to ) \
            } \
          } \
          FILTER ( ?from != ?to ) \
        } \
        ORDER BY ?from ?to \
      ';
      /* jshint multistr: false */
      return mlRest.sparql(query).then(function(response) {
        return response && response.data && response.data.results && reformatBindings(response.data.results.bindings);
      });
    }

    function getTriplesData() {
      return mlRest.things(''+predicate+'').then(function(response) {
        return { data: response && response.data };
      });
    }

    function addSynonymWithSparql(from, to) {
      /* jshint multistr: true */
      var query = '\
        INSERT DATA { \
          "'+from+'" <'+predicate+'> "'+to+'". \
        } \
      ';
      /* jshint multistr: false */
      return mlRest.sparqlUpdate(query);
    }

    function removeSynonymWithSparql(from, to) {
      /* jshint multistr: true */
      var query = '\
        DELETE DATA { \
          "'+from+'" <'+predicate+'> "'+to+'". \
          "'+to+'" <'+predicate+'> "'+from+'". \
        } \
      ';
      /* jshint multistr: false */
      return mlRest.sparqlUpdate(query);
    }

    return {
      getSynonyms: getSynonymsFromSparql,
      getData: getTriplesData,
      addSynonym: addSynonymWithSparql,
      removeSynonym: removeSynonymWithSparql
    };

  }
}());

(function(module) {
try {
  module = angular.module('ml.synonyms.tpls');
} catch (e) {
  module = angular.module('ml.synonyms.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/ml-synonyms-ng/ml-synonyms.html',
    '<div class="ml-synonyms">\n' +
    '  <form ng-if="addSynonym" class="form-inline" ng-submit="addSynonym({from: newFrom, to: newTo})">\n' +
    '    <input type="text" placeholder="{{fromLabel}}.." ng-model="newFrom">\n' +
    '    <input type="text" placeholder="{{toLabel}}.." ng-model="newTo">\n' +
    '    <button class="btn btn-default btn-sm"><i class="fa fa-link fa-2x" ng-click="addSynonym({from: newFrom, to: newTo})"></i></button>\n' +
    '  </form>\n' +
    '  <table class="table-hover">\n' +
    '    <thead>\n' +
    '      <tr>\n' +
    '        <th>{{fromLabel}}</th>\n' +
    '        <th>\n' +
    '        <th>{{toLabel}}</th>\n' +
    '        <th>\n' +
    '      </tr>\n' +
    '    </thead>\n' +
    '    <tbody ng-repeat="(key, syns) in synonyms">\n' +
    '      <tr ng-repeat="synonym in syns">\n' +
    '        <td class="from"><span ng-if="$first">{{key}}</span></td>\n' +
    '        <td class="link">{{ $first ? (!$last ? \'┳\' : \'━\') : (!$last ? \'┣\' : \'┗\') }}</td>\n' +
    '        <td class="to">{{synonym.to}}</td>\n' +
    '        <td class="action" ng-if="addSynonym || removeSynonym">\n' +
    '          <a href ng-if="removeSynonym && synonym.direct"><i class="fa fa-unlink" ng-click="removeSynonym({from: key, to: synonym.to})"></i></a>\n' +
    '          <a href ng-if="addSynonym && !synonym.direct"><i class="fa fa-link" ng-click="addSynonym({from: key, to: synonym.to})"></i></a>\n' +
    '        </td>\n' +
    '      </tr>\n' +
    '    </tbody>\n' +
    '  </table>\n' +
    '  <div ng-if="data.data">\n' +
    '    <button class="btn btn-default btn-sm" ng-click="showData = !showData">{{showData ? \'Hide\' : \'Show\'}} Data</button>\n' +
    '    <pre ng-show="showData">{{data.data}}</pre>\n' +
    '  </div>\n' +
    '</div>');
}]);
})();
