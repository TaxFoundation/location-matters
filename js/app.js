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
          left: 50
        }
      };

      this.svg = d3.select('#state-charts').append('svg')
        .attr('height', views.dimensions.height + views.dimensions.margin.top + views.dimensions.margin.bottom)
        .attr('width', views.dimensions.width + views.dimensions.margin.right + views.dimensions.margin.left);
      this.format = {decimal: d3.format(',.1%'), round: d3.format('%')};
      this.x = d3.scale.ordinal().rangeRoundBands([views.dimensions.margin.left, views.dimensions.width], 0.3);
      this.y = d3.scale.linear().rangeRound([0, views.dimensions.height]);
      this.xAxis = d3.svg.axis().scale(views.x).orient('bottom');
      this.yAxis = d3.svg.axis().scale(views.y).orient('left').tickFormat(views.format.round);
      this.fills = ['#da9147', '#833749', '#55897b', '#16416a'];
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('opacity', 0);

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

      views.svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + views.dimensions.margin.left + ', 0)')
          .call(views.yAxis)
          .selectAll('.tick line')
          .attr('x2', views.dimensions.width - views.dimensions.margin.left);

      views.svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + views.dimensions.height + ')')
        .call(views.xAxis)
        .selectAll('.tick text')
        .call(views.wrap, views.x.rangeBand());

      d3.select('.x').selectAll('.tick').selectAll('text')
        .attr('transform', 'rotate(45)')
        .attr('style', 'text-anchor:start');

      views.svg.append('line')
        .attr('class', 'baseline')
        .attr('x1', views.dimensions.margin.left)
        .attr('y1', 0)
        .attr('x2', views.dimensions.width)
        .attr('y2', 0)
        .attr('transform', 'translate(0, ' + baseline + ')')
        .attr('style', function() { return min === 0 ? 'display: none' : 'shape-rendering: crispEdges;stroke:rgb(0,0,0);stroke-width:1'; });

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
            '#7f7f7f'
          );
        } else {
          for (var i = 0, j = oldKeys.length; i < j; i++) {
            var barData = {};
            for (var m = i, n = j; m < n; m++) {
              barData[oldKeys[m]] = oldData[oldKeys[m]];
            }

            views.appendRect(
              bars,
              name,
              oldKeys[i],
              views.round(oldData[oldKeys[i]], 3),
              views.round(views.sumValues(barData).sum, 9),
              'old',
              max,
              baseline,
              views.fills[i]
            );
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
            '#7f7f7f'
          );
        } else {
          for (var i = 0, j = newKeys.length; i < j; i++) {
            var barData = {};
            for (var m = i, n = j; m < n; m++) {
              barData[newKeys[m]] = newData[newKeys[m]];
            }

            views.appendRect(
              bars,
              name,
              newKeys[i],
              views.round(newData[newKeys[i]], 3),
              views.round(views.sumValues(barData).sum, 9),
              'new',
              max,
              baseline,
              views.fills[i]
            );
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
        .attr('width', Math.round(views.x.rangeBand() / 2.5))
        .attr('x', function(d) { return status === 'old' ? Math.round(views.x(name)) : Math.round(views.x(name) + views.x.rangeBand() / 2); })
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
        label + ': ' + (number ? views.format.decimal(number) : 'No Data')
      )
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY + 50) + 'px');
    },

    wrap: function(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr('y'),
            dy = parseFloat(text.attr('dy')),
            tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(' '));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
          }
        }
      });
    }
  };
}());
