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
      this.fills = ['#F44336', '#2196F3', '#4CAF50', '#FF9800'];
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('opacity', 0);

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
      var min = extent.min;
      var max = extent.max;
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

      for (var firm in data.firms) {
        var name = data.firms[firm].name;
        var oldData = data.firms[firm].old;
        var newData = data.firms[firm].new;
        var oldKeys = d3.keys(oldData);
        var newKeys = d3.keys(newData);

        if (views.sumValues(oldData).condense === true) {
          views.appendRect(
            bars,
            name,
            oldKeys[0],
            views.round(oldData[oldKeys[0]], 3),
            views.round(views.sumValues(oldData).sum, 9),
            'old',
            max,
            baseline,
            '#888888'
          );
        } else {
          for (var i = 0, j = oldKeys.length; i < j; i++) {
            views.appendRect(
              bars,
              name,
              oldKeys[0],
              views.round(oldData[oldKeys[0]], 3),
              views.round(views.sumValues(oldData).sum, 9),
              'old',
              max,
              baseline,
              views.fills[i]
            );
            delete oldData[oldKeys[0]];
            oldKeys.shift();
          }
        }

        if (views.sumValues(newData).condense === true) {
          views.appendRect(
            bars,
            name,
            newKeys[0],
            views.round(newData[newKeys[0]], 3),
            views.round(views.sumValues(newData).sum, 9),
            'new',
            max,
            baseline,
            '#888888'
          );
        } else {
          for (var i = 0, j = newKeys.length; i < j; i++) {
            views.appendRect(
              bars,
              name,
              newKeys[0],
              views.round(newData[newKeys[0]], 3),
              views.round(views.sumValues(newData).sum, 9),
              'new',
              max,
              baseline,
              views.fills[i]
            );
            delete newData[newKeys[0]];
            newKeys.shift();
          }
        }
      }

    },

    allValues: function(data) {
      var taxSums = [];
      var condense = false;
      for (var firm in data) {
        var sumOldTaxes = 0;
        var sumNewTaxes = 0;
        var oldTaxes = data[firm].old;
        var newTaxes = data[firm].new;

        for (var tax in oldTaxes) {
          var thisTax = parseFloat(oldTaxes[tax]);
          sumOldTaxes += thisTax;
        }

        for (var tax in newTaxes) {
          var thisTax = parseFloat(newTaxes[tax]);
          sumNewTaxes += thisTax;
        }

        sumOldTaxes = views.round(sumOldTaxes, 9);
        sumNewTaxes = views.round(sumNewTaxes, 9);
        taxSums.push(sumOldTaxes);
        taxSums.push(sumNewTaxes);
      }

      return {
        min: Math.min(0, d3.min(taxSums)),
        max: d3.max(taxSums) + 0.03
      };
    },

    round: function(value, decimals) {
      return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    },

    sumValues: function(data) {
      var sumValues = 0;
      var values = data;
      var condense = false;

      for (var value in values) {
        var thisVal = parseFloat(values[value]);
        if (thisVal < 0 && !condense) {
          condense = true;
        }

        sumValues += thisVal;
      }

      return {
        sum: sumValues,
        condense: condense
      };
    },

    appendRect: function(selection, name, tax, taxVal, value, status, max, baseline, fill) {
      selection.append('rect')
        .attr('y', function() {
          return value > 0 ? views.y(value) - views.y(max) : baseline;
        })
        .attr('height', function() { return Math.abs(views.y(value) - baseline); })
        .attr('width', views.x.rangeBand() / 2)
        .attr('x', function(d) { return status === 'old' ? views.x(name) : views.x(name) + views.x.rangeBand() / 2; })
        .attr('fill', fill)
        .on('mouseover', function() { return views.addTooltip(tax, taxVal); })
        .on('mousemove', function() { return views.tooltip.style('left', (d3.event.pageX) + 'px').style('top', (d3.event.pageY + 50) + 'px'); })
        .on('mouseout', function() { return views.tooltip.transition().duration(200).style('opacity', 0); });
    },

    addTooltip: function(label, number) {
      views.tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
      views.tooltip.html(
        label + ': ' + (number ? number : 'No Data')
      )
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY + 50) + 'px');
    }
  };
}());
