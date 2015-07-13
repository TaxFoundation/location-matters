(function() {
  'use strict';

  var app,
    views,
    DATA_PATH = 'data/location-matters-2015.json';

  $(function() {
    d3.json(DATA_PATH, function(error, data) {
      if (error) { return error; }

      app.initialize(data);
    });
  });

  app = {
    initialize: function(data) {
      this.data = data;
      views.stateBars(this.filter());
    },

    filter: function(value) {
      var state = value || $('#state-select').val();
      var stateData = this.data.filter(function(stateData) {
        return stateData.name === state;
      });

      return stateData;
    }
  }

  views = {
    stateBars: function(data) {
      var _this = this;

      this.data = data;
      console.log(this.data);
      this.element = d3.select('#state-charts');
      this.svg = this.element.append('svg');
      this.x = d3.scale.ordinal().rangeRoundBands([0, 600]);
      this.y = d3.scale.linear().rangeRound([0, 500]);
      this.xAxis = d3.svg.axis().scale(this.x).orient('bottom');
      this.yAxis = d3.svg.axis().scale(this.y).orient('left');

    }
  };
}());
