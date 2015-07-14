(function() {
  'use strict';

  var app,
    views,
    DATA_PATH = 'data/location-matters-2015.json';

  $(function() {
    d3.json(DATA_PATH, function(error, data) {
      if (error) { console.log(error); }

      app.initialize(data);
    });
  });

  app = {
    initialize: function(data) {
      this.data = data;

      views.initialize(app.filter());

      $('#state-select').change(function(e) { // Watch for changes to the state selection dropdown and call app.filter
        views.initialize(app.filter($(e.target).attr('value')));
      });
    },

    filter: function(value) {
      var state = value || $('#state-select').val();
      var stateData = app.data.filter(function(stateData) {
        return stateData.name === state;
      });

      return stateData[0];
    }
  }

  views = {
    initialize: function(data) {
      this.data = data;
      this.dimensions = {
        width: 600,
        height: 500
      };

      var svg = d3.select('#state-charts').append('svg'),
        x = d3.scale.ordinal().rangeRoundBands([0, views.dimensions.width], 0.1).domain(views.data.firms.map(function(d) { return d.name; })),
        y = d3.scale.linear().rangeRound([0, views.dimensions.height]),
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

      var firmGroups = svg.selectAll('.state')
          .data(views.data.firms)
        .enter().append('g')
          .attr('transform', function(d) { return 'translate(' + x(d.name) + ',0)'; });

      firmGroups.append('rect')
        .attr('y', function(d) { return y(d.new['Income Tax']); })
        .attr('height', function(d) { return views.dimensions.height - y(d.new['Income Tax']); })
        .attr('width', 10)
        .attr('fill', '#0094ff');
    }
  };
}());
