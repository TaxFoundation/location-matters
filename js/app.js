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
      views.stateBars(app.filter());

      $('#state-select').change(function(e) { // Watch for changes to the state selection dropdown and call app.filter
        views.stateBars(app.filter($(e.target).attr('value')));
      });
    },

    filter: function(value) {
      var state = value || $('#state-select').val();
      var stateData = this.data.filter(function(stateData) {
        return stateData.name === state;
      });

      return stateData[0];
    }
  }

  views = {
    stateBars: function(data) {
      var _this = this;

      this.data = data;
      var svg = d3.select('#state-charts').append('svg'),
        x = d3.scale.ordinal().rangeRoundBands([0, 600], 0.1),
        y = d3.scale.linear().rangeRound([0, 500]),
        xAxis = d3.svg.axis().scale(x).orient('bottom'),
        yAxis = d3.svg.axis().scale(y).orient('left');

      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + 500 + ')')
        .call(xAxis);

      svg.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
        .append('text')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end');

      svg.selectAll('.state')
          .data(views.data.firms)
        .enter().append('g')
          .attr('transform', function(d) { return 'translate(' + x(d.name) + ',0)'; });
    }
  };
}());
