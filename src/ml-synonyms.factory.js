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
