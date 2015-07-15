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
          right: 30,
          bottom: 100,
          left: 40
        }
      };

      this.svg = d3.select('#state-charts').append('svg')
        .attr('height', views.dimensions.height + views.dimensions.margin.top + views.dimensions.margin.bottom)
        .attr('width', views.dimensions.width + views.dimensions.margin.right + views.dimensions.margin.left);
      this.x = d3.scale.ordinal().rangeRoundBands([views.dimensions.margin.left, views.dimensions.width], 0.1);
      this.y = d3.scale.linear().rangeRound([0, views.dimensions.height]);
      this.xAxis = d3.svg.axis().scale(views.x).orient('bottom');
      this.yAxis = d3.svg.axis().scale(views.y).orient('left');

      views.svg.append('line')
        .attr('class', 'baseline')
        .attr('x1', views.dimensions.margin.left)
        .attr('y1', 0)
        .attr('x2', views.dimensions.width)
        .attr('y2', 0)
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:1');

      views.draw(data);
    },

    draw: function(data) {
      d3.selectAll('g').remove();

      var bars = views.svg.selectAll('.firm').data(data.firms);
      var extent = views.allValues(data.firms);
      var min = d3.min(extent);
      var max = d3.max(extent);
      views.x.domain(data.firms.map(function(d) { return d.name; }));
      views.y.domain([max, min]);

      var baseline = views.y(0);

      d3.select('.baseline')
        .attr('transform', 'translate(0, ' + baseline + ')');

      views.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + views.dimensions.height + ')')
        .call(views.xAxis);

      views.svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + views.dimensions.margin.left + ', 0)')
          .call(views.yAxis);

      d3.select('.x').selectAll('.tick').selectAll('text')
        .attr('transform', 'rotate(45)')
        .attr('style', 'text-anchor:start');

      bars.enter()
        .append('g')
        .attr('class', 'firm');

// TODO move data assignment and rect appending inside these for loops to cover multiple tax types
      for (var firm in data.firms) {
        var name = data.firms[firm].name;
        var sumOldTaxes = 0;
        var sumNewTaxes = 0;
        for (var tax in data.firms[firm].old) {
          var thisTax = parseFloat(data.firms[firm].old[tax]);
          sumOldTaxes += thisTax;
        }
        for (var tax in data.firms[firm].new) {
          var thisTax = parseFloat(data.firms[firm].old[tax]);
          sumNewTaxes += thisTax;
        }

      }

      bars
        .append('rect')
        .attr('y', function(d) {
          return +d.old['Income Tax'] > 0 ? views.y(+d.old['Income Tax']) - views.y(max) : baseline;
        })
        .attr('height', function(d) { return Math.abs(views.y(+d.old['Income Tax']) - baseline); })
        .attr('width', views.x.rangeBand() / 2)
        .attr('x', function(d) { return views.x(d.name); })
        .attr('fill', '#0094ff');

      bars
        .append('rect')
        .attr('y', function(d) {
          return +d.new['Income Tax'] > 0 ? views.y(+d.new['Income Tax']) - views.y(max) : baseline;
        })
        .attr('height', function(d) { return Math.abs(views.y(+d.new['Income Tax']) - baseline); })
        .attr('width', views.x.rangeBand() / 2)
        .attr('x', function(d) { return views.x(d.name) + views.x.rangeBand() / 2; })
        .attr('fill', '#0094ff');
    },

    allValues: function(data) {
      var newFirms = data.map(function(d) {return d.new;});
      var oldFirms = data.map(function(d) {return d.old;});
      var values = [0, 0.15]; // default domain
      for (var i = 0, j = newFirms.length; i < j; i++) {
        for (var m = 0, n = d3.values(newFirms[i]).length; m < n; m++) {
          values.push(parseFloat(d3.values(newFirms[i])[m]))
        }
      }

      for (var i = 0, j = oldFirms.length; i < j; i++) {
        for (var m = 0, n = d3.values(oldFirms[i]).length; m < n; m++) {
          values.push(parseFloat(d3.values(oldFirms[i])[m]))
        }
      }

      return d3.extent(values);
    }
  };
}());
