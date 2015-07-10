(function() {
  'use strict';

  var app,
    views,
    DATA_PATH = 'data/location-matters-2015.csv';

  $(function() {
    d3.csv(DATA_PATH, function(d) {
      return {
        name: d.name,
        value: +d.value
      };
    }, app.initialize);
  });

  app = {
    initialize: function(data) {
      console.log(data);
    }
  }

  views = {};

  views.stateBars = function(data) {
    var _this = this;

    this.data = data;
    this.element = d3.select('#state-charts');
    this.svg = element.append('svg');
    this.x = d3.scale().linear().domain([0, 600]);
    this.y = d3.scale().linear().domain([0, 500]);
  }
}());
