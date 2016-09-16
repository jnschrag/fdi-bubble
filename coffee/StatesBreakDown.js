var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

this.StatesBreakDown = (function(superClass) {
  extend(StatesBreakDown, superClass);

  function StatesBreakDown(id, data, color, domain) {
    this.update_display = bind(this.update_display, this);
    this.update_data = bind(this.update_data, this);
    this.show_cities = bind(this.show_cities, this);
    this.trigger_show_cities = bind(this.trigger_show_cities, this);
    this.hide_details = bind(this.hide_details, this);
    this.show_details = bind(this.show_details, this);
    this.create_vis = bind(this.create_vis, this);
    var i;
    StatesBreakDown.__super__.constructor.call(this, id, data, color);
    this.domain = domain != null ? domain : d3.range(100, 1700, 200);
    this.color_class = d3.scale.threshold().domain(this.domain).range((function() {
      var j, results;
      results = [];
      for (i = j = 8; j >= 0; i = --j) {
        results.push("q" + i + "-9");
      }
      return results;
    })());
    this.crimes = [];
    this.legend_text = (function(_this) {
      return function() {
        var e, text;
        text = (function() {
          var j, len, ref, results;
          ref = this.domain;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            e = ref[j];
            results.push("< " + e);
          }
          return results;
        }).call(_this);
        text.push(_this.domain[_this.domain.length - 1] + " or more");
        return text;
      };
    })(this);
    this.tips = {};
  }

  StatesBreakDown.prototype.create_vis = function() {
    this.tips = {};
    StatesBreakDown.__super__.create_vis.call(this);
    this.legend = new Legend(this.vis, ((function(_this) {
      return function(i) {
        return _this.color_class(_this.domain[i] - 1);
      };
    })(this)), this.legend_text(), 'Crime per 100,000 population', {
      x: 75,
      y: 40
    });
    this.legend.show(true);
    this.create_scale();
    return $(this.id).append("<div style='position: relative; left: " + this.width + "px; top: -600px'><span>Click a bubble for details</span></div>");
  };

  StatesBreakDown.prototype.get_group_data = function(d) {
    return [d];
  };

  StatesBreakDown.prototype.get_group_title = function(d) {
    return d.name;
  };

  StatesBreakDown.prototype.display = function() {
    StatesBreakDown.__super__.display.call(this);
    return this.groups.on("click", (function(_this) {
      return function(d, i) {
        return _this.trigger_show_cities(d, i, _this);
      };
    })(this));
  };

  StatesBreakDown.prototype.show_details = function(data) {
    var content, crime;
    content = "<b> &lt;Click Me&gt; </b><br />";
    content += "Population: " + (this.fixed_formatter(data.value)) + "<br/>Crime: " + (this.fixed_formatter(d3.sum((function() {
      var j, len, ref, results;
      ref = this.crimes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        crime = ref[j];
        results.push(data[crime]);
      }
      return results;
    }).call(this)))) + "<br />";
    content += "Crime per 100,000: " + (this.percent_formatter(data.group));
    if (this.tips[data.id] == null) {
      this.tips[data.id] = new Opentip("#" + data.id, content, "", {
        style: "glass",
        target: true,
        showOn: "creation",
        stem: "middle",
        tiptJoint: "middle"
      });
    } else {
      this.tips[data.id].setContent(content);
    }
    return this.tips[data.id].show();
  };

  StatesBreakDown.prototype.hide_details = function(data) {
    var ref;
    return (ref = this.tips[data.id]) != null ? ref.hide() : void 0;
  };

  StatesBreakDown.prototype.trigger_show_cities = function(d, i) {
    var ref, that;
    if ((ref = this.tips[d.id]) != null) {
      ref.hide();
    }
    this.data.forEach(((function(_this) {
      return function(d, i) {
        d.x = d.px = _this.getX(i);
        return d.y = d.py = _this.getY(i);
      };
    })(this)));
    that = this;
    this.groups.transition().duration(1200).attr("transform", function(d, i) {
      return "translate(" + (that.width + that.getX(i)) + ", " + (that.getY(i)) + ")";
    });
    this.cleanup();
    return d3.timer((function() {
      $.bbq.pushState({
        'by_state': i
      });
      return true;
    }), 1400);
  };

  StatesBreakDown.prototype.show_cities = function(i) {
    var data, link;
    data = this.data[i].cities;
    this.byCity = new AllStates(this.id, data, this.colorScheme, this.domain);
    this.byCity.crimes = this.crimes;
    if (this.data[i].id === "NEW_JERSEY" || this.data[i].id === "CONNECTICUT") {
      this.byCity.height = 900;
      this.byCity.center = {
        x: this.byCity.width / 2,
        y: this.byCity.height / 2
      };
      this.byCity.max_range = 60;
      this.byCity.scale();
      this.byCity.update_data();
    }
    this.byCity.create_vis();
    this.byCity.display();
    this.byCity.bubble_scale.svg.attr("height", this.byCity.bubble_scale.height + 80);
    this.byCity.bubble_scale.svg.append("text").attr("x", this.byCity.bubble_scale.width / 2 + 5).attr("y", this.byCity.bubble_scale.height + 20).attr("text-anchor", "middle").style("font-size", "18").text(this.data[i].name);
    link = '<a href="#by_state">Back to the states view</a>';
    return $("#" + this.byCity.bubble_scale.id).append(link);
  };

  StatesBreakDown.prototype.update_data = function() {
    StatesBreakDown.__super__.update_data.call(this);
    if (this.crimes.length > 0) {
      return this.data.forEach((function(_this) {
        return function(d) {
          var crime;
          return d.group = d3.sum((function() {
            var j, len, ref, results;
            ref = this.crimes;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              crime = ref[j];
              results.push(d[crime]);
            }
            return results;
          }).call(_this)) / d.value * 100000;
        };
      })(this));
    }
  };

  StatesBreakDown.prototype.update_display = function(state) {
    var that;
    this.update_data();
    that = this;
    if (state != null) {
      if (this.byCity == null) {
        return this.show_cities(state);
      } else {
        this.byCity.crimes = this.crimes;
        this.byCity.cleanup();
        return this.byCity.update_display();
      }
    } else {
      return this.get_groups().selectAll("circle").transition().duration(1000).attr("class", function(d) {
        return that.color_class(d.group);
      }).each("end", function(d) {
        return d3.select(this).attr("stroke", d3.rgb($(this).css("fill")).darker());
      });
    }
  };

  return StatesBreakDown;

})(BreakdownChart);