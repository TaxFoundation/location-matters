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
        views.draw(app.filter($(e.target).attr('value')));
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
      this.dimensions = {
        width: 600,
        height: 500,
        margin: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      };

      this.svg = d3.select('#state-charts').append('svg')
        .attr('height', views.dimensions.height + views.dimensions.margin.top + views.dimensions.margin.bottom)
        .attr('width', views.dimensions.width + views.dimensions.margin.right + views.dimensions.margin.left);
      this.x = d3.scale.ordinal().rangeRoundBands([0, views.dimensions.width], 0.1);
      this.y = d3.scale.linear().rangeRound([views.dimensions.margin.top, views.dimensions.height]).domain([-0.3, 0.3]);
      this.xAxis = d3.svg.axis().scale(views.x).orient('bottom');
      this.yAxis = d3.svg.axis().scale(views.y).orient('left');

      views.svg.append('line')
        .attr('x1', 0)
        .attr('y1', views.y(0))
        .attr('x2', views.dimensions.width)
        .attr('y2', views.y(0))
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:1');

      views.draw(data);
    },

    draw: function(data) {
      d3.selectAll('g').remove();

      var bars = views.svg.selectAll('.firm').data(data.firms);
      views.x.domain(data.firms.map(function(d) { return d.name; }));

      views.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + views.dimensions.height + ')')
        .call(views.xAxis);

      views.svg.append('g')
          .attr('class', 'y axis')
          .call(views.yAxis);

      bars.enter()
        .append('g')
        .attr('class', 'firm');

      bars
        .append('rect')
        .attr('y', function(d) {
          var yCoord = +d.old['Income Tax'] > 0 ? views.y(Math.min(0, +d.old['Income Tax'])) : views.y(0);
          var height = Math.abs(views.y(+d.old['Income Tax']) - views.y(0));
          return yCoord - height;
        })
        .attr('height', function(d) { return Math.abs(views.y(+d.old['Income Tax']) - views.y(0)); })
        .attr('width', views.x.rangeBand() / 2)
        .attr('x', function(d) { return views.x(d.name); })
        .attr('fill', '#0094ff');

      bars
        .append('rect')
        .attr('y', function(d) {
          var yCoord = +d.new['Income Tax'] > 0 ? views.y(Math.min(0, +d.new['Income Tax'])) : views.y(0);
          var height = Math.abs(views.y(+d.new['Income Tax']) - views.y(0));
          console.log(yCoord);
          return yCoord - height;
        })
        .attr('height', function(d) { return Math.abs(views.y(+d.new['Income Tax']) - views.y(0)); })
        .attr('width', views.x.rangeBand() / 2)
        .attr('x', function(d) { return views.x(d.name) + views.x.rangeBand() / 2; })
        .attr('fill', '#0094ff');
    }
  };
}());
