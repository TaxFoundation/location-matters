(function() {
  'use strict';

  var app;
  var views;
  var DATA_PATH = 'data/location-matters-2015.json';

  $(function() {
    d3.json(DATA_PATH, function(error, data) {
      if (error) { console.log(error); }

      app.initialize(data);
    });
  });

  app = {
    initialize: function(data) {
      this.data = data;

      views.initialize(app.stateFilter());

      // Watch for changes to the state selection dropdown, call app.stateFilter
      $('#state-select').change(function(e) {
        var state = $(e.target).attr('value');
        views.draw(app.stateFilter(state));
        views.drawStateTable(app.stateFilter(state));
      });

      // Watch for changes to the firm selection dropdown, call app.firmFilter
      $('#firm-select').change(function(e) {
        var firm = $(e.target).attr('value');
        views.drawFirmTable(app.firmFilter(firm));
      });
    },

    stateFilter: function(value) {
      var state = value || $('#state-select').val();
      var stateData = app.data.filter(function(stateData) {
        return stateData.name === state;
      });

      return stateData[0];
    },

    firmFilter: function(value) {
      var firm = value || $('#firm-select').val();
      var firmData = {
        name: firm,
        states: [],
      };
      app.data.forEach(function(stateEntry) {
        stateEntry.firms.forEach(function(firmEntry) {
          if (firmEntry.name === firm) {
            var oldSum = 0;
            var newSum = 0;
            for (var taxType in firmEntry.old) {
              oldSum += +firmEntry.old[taxType];
            }

            for (var taxType in firmEntry.new) {
              newSum += +firmEntry.new[taxType];
            }

            firmData.states.push({name: stateEntry.name, old: oldSum, new: newSum});
          }
        });
      });

      return firmData;
    },
  };

  views = {
    initialize: function(data) {
      this.dimensions = {
        width: Math.min(800, $('#state-charts').width()),
        height: Math.min(500, $('#state-charts').width() * 0.8),
        margin: {
          top: 20,
          right: 30,
          bottom: 100,
          left: 50,
        },
      };

      this.svg = d3.select('#state-charts').append('svg')
        .attr('height', views.dimensions.height + views.dimensions.margin.top + views.dimensions.margin.bottom)
        .attr('width', views.dimensions.width + views.dimensions.margin.right + views.dimensions.margin.left);
      this.format = {decimal: d3.format(',.1%'), round: d3.format('%'), twoDecimal: d3.format(',.2%')};
      this.x = d3.scale.ordinal().rangeRoundBands([views.dimensions.margin.left, views.dimensions.width], 0.3);
      this.y = d3.scale.linear().rangeRound([views.dimensions.margin.top, views.dimensions.height]);
      this.xAxis = d3.svg.axis().scale(views.x).orient('bottom');
      this.yAxis = d3.svg.axis().scale(views.y).orient('left').tickFormat(views.format.round);
      this.fills = ['#faa426', '#1ebf86', '#3a6c83', '#2dbae8'];
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('opacity', 0);

      views.draw(data);
      views.drawStateTable(data);
      views.drawFirmTable(app.firmFilter());
      d3.selectAll('.not-loaded').classed('not-loaded', false);
    },

    draw: function(data) {
      // Remove old chart elements
      d3.selectAll('.axis').remove();
      d3.selectAll('.tax-bar').remove();
      d3.selectAll('.total-effective-rate').remove();
      d3.selectAll('.firm-status').remove();
      d3.select('.baseline').remove();

      var extent = views.allValues(data.firms);
      var min = extent.min;
      var max = extent.max;

      views.x.domain(data.firms.map(function(d) {
        return d.name;
      }));

      views.y.domain([max, min]);
      var baseline = views.y(0);

      d3.select('#graph-title').html(function() {
        return 'Graph of Effective Tax Rates in ' + data.name;
      });

      // Call axes
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
        .attr('transform', 'translate(0, 18), rotate(45)')
        .attr('style', 'text-anchor:start');

      views.svg.append('line')
        .attr('class', 'baseline')
        .attr('x1', views.dimensions.margin.left)
        .attr('y1', 0)
        .attr('x2', views.dimensions.width)
        .attr('y2', 0)
        .attr('transform', 'translate(0, ' + baseline + ')')
        .attr('style', function() {
          return min === 0
          ? 'display: none'
          : 'shape-rendering: crispEdges;stroke:rgb(0,0,0);stroke-width:1';
        });

      var firmTypes = ['old', 'new'];

      for (var firm in data.firms) {
        for (var p = 0, q = firmTypes.length; p < q; p++) {
          var name = data.firms[firm].name;
          var taxData = data.firms[firm][firmTypes[p]];
          var taxKeys = d3.keys(taxData);
          var totalEffectiveRate = views.sumValues(taxData);

          // Total effective tax rate labels
          views.svg.append('text')
            .attr('x', function() {
              return views.findX(firmTypes[p], name)
              + Math.round(views.x.rangeBand() / 5);
            })
            .attr('y', function() {
              return totalEffectiveRate.sum < 0
              ? views.y(totalEffectiveRate.sum) + 6
              : views.findY(totalEffectiveRate.sum, max, baseline);
            })
            .attr('transform', 'translate(0, ' + (
              totalEffectiveRate.sum < 0
              ? 5
              : -5
            ) + ')')
            .attr('class', 'total-effective-rate')
            .text(function() {
              return views.format.decimal(totalEffectiveRate.sum);
            });

          // Mature v. New labels
          views.svg.append('text')
            .attr('class', 'firm-status')
            .attr('x', function() {
              return views.findX(firmTypes[p], name)
              + Math.round(views.x.rangeBand() / 5);
            })
            .attr('y', views.y(min) + 18)
            .attr('style', 'text-anchor:middle')
            .text(function() {
              return firmTypes[p] === 'old'
              ? 'M'
              : 'N';
            });

          // Draw the rects
          if (totalEffectiveRate.condense === true) {
            views.appendRect(
              views.svg,
              name,
              'Effective Rate',
              views.round(totalEffectiveRate.sum, 3),
              views.round(totalEffectiveRate.sum, 9),
              firmTypes[p],
              max,
              baseline,
              '#7f7f7f'
            );
          } else {
            for (var i = 0, j = taxKeys.length; i < j; i++) {
              var barData = {};
              for (var m = i, n = j; m < n; m++) {
                barData[taxKeys[m]] = taxData[taxKeys[m]];
              }

              views.appendRect(
                views.svg,
                name,
                taxKeys[i],
                views.round(taxData[taxKeys[i]], 3),
                views.round(views.sumValues(barData).sum, 9),
                firmTypes[p],
                max,
                baseline,
                views.fills[i]
              );
            }
          }
        }
      }

    },

    drawStateTable: function(data) {
      d3.select('#firm-data').selectAll('tr').remove();

      d3.select('#table-title').html(function() {
        return 'Table of Effective Tax Rates in ' + data.name;
      });

      var rows = d3.select('#firm-data').selectAll('tr');

      rows.data(data.firms).enter()
        .append('tr')
        .html(function(d) {
          var name = d.name;
          var oldFirm = views.format.twoDecimal(views.sumValues(d.old).sum);
          var newFirm = views.format.twoDecimal(views.sumValues(d.new).sum);

          return '<td>'
          + name
          + '</td><td class="table-data">'
          + oldFirm
          + '</td><td class="table-data">'
          + newFirm
          + '</td>';
        });
    },

    drawFirmTable: function(data) {
      d3.select('#state-firm-data').selectAll('tr').remove();

      d3.select('#firm-graph-title').html(function() {
        return 'Table of Effective Tax Rates for ' + data.name;
      });

      var rows = d3.select('#state-firm-data').selectAll('tr');

      rows.data(data.states).enter()
        .append('tr')
        .html(function(d) {
          var name = d.name;
          var oldFirm = views.format.twoDecimal(d.old);
          var newFirm = views.format.twoDecimal(d.new);

          return '<td>'
          + name
          + '</td><td class="table-data">'
          + oldFirm
          + '</td><td class="table-data">'
          + newFirm
          + '</td>';
        });
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
        min: d3.min(taxSums) < 0 ? d3.min(taxSums) - 0.05 : 0,
        max: Math.max(0.37, d3.max(taxSums) + 0.05),
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
        condense: condense,
      };
    },

    appendRect: function(selection, name, tax, taxVal, value, status, max, baseline, fill) {
      selection.append('rect')
        .attr('class', 'tax-bar')
        .attr('y', function() {
          return views.findY(value, max, baseline);
        })
        .attr('height', function() { return Math.abs(views.y(value) - baseline); })
        .attr('width', Math.round(views.x.rangeBand() / 2.5))
        .attr('x', function() { return views.findX(status, name); })
        .attr('fill', fill)
        .on('mouseover', function() {
           return views.addTooltip(tax, taxVal);
         })
        .on('mousemove', function() {
           return views.tooltip
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY + 50) + 'px');
         })
        .on('mouseout', function() {
           return views.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
         });
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
        var text = d3.select(this);
        var words = text.text().split(/\s+/);
        var tspan = text.text(null)
          .append('tspan')
          .attr('x', 0)
          .attr('y', text.attr('y'))
          .attr('dy', parseFloat(text.attr('dy')) + 'em');

        for (var i = 0, j = words.length; i < j; i++) {
          text
            .append('tspan')
            .attr('x', 0)
            .attr('y', text.attr('y'))
            .attr('dy', i * 1.1 + parseFloat(text.attr('dy')) + 'em')
            .text(words[i]);
        }
      });
    },

    findX: function(status, name) {
      return status === 'old'
      ? Math.round(views.x(name))
      : Math.round(views.x(name) + views.x.rangeBand() / 2);
    },

    findY: function(value, max, baseline) {
      return value > 0
      ? views.y(value) - views.y(max) + views.dimensions.margin.top
      : baseline;
    },
  };
}());
