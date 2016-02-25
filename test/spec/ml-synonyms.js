/* global describe, beforeEach, module, it, expect, inject */

describe('MLLodlive', function () {
  'use strict';

  var factory, $httpBackend, $q, $location;

  beforeEach(module('ml.lodlive'));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');

    factory = $injector.get('MLLodlive', $q, $httpBackend);
  }));


});
