

/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
// Constants for sizing
  var dim = Math.min(parseInt(d3.select("#vis").style("width")), parseInt(d3.select("#vis").style("height")));
  var width = $("#vis").width();
  var height = $("#vis").height();

function bubbleChart() {

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('gates_tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var regionCenters = {
    "Americas": { x: width / 3, y: height / 2.5 },
    "Europe": { x: width / 2, y: height / 2.5 },
    "Asia": { x: 2 * width / 3, y: height / 2.5 },
    "Africa": { x: width / 3 - 40, y: height / 1.5 },
    "Oceania": { x: 2 * width / 3 + 30, y: height / 1.5 }
  };

  // X locations of the year titles.
  var regionsTitleX = {
    "Americas": width / 3 - 100,
    "Europe": width / 2,
    "Asia": 2 * width / 3 + 100,
    "Africa": width / 3 - 100,
    "Oceania": 2 * width / 3 + 100
  };

  var regionsTitleY = {
    "Americas": 40,
    "Europe": 40,
    "Asia": 40,
    "Africa": height / 1.4,
    "Oceania": height / 1.4
  };

  // World Bank Development Level Titles
  var devLevelsInfo = {
    "5": { x: width / 3 - 100, y: 40, title: "OECD high-income economies" },
    "4": { x: width / 2, y: 40, title: "High-income economies" },
    "3": { x: 2 * width / 3 + 100, y: 40, title: "Upper middle-income economies" },
    "2": { x: width / 3 - 40, y: height / 1.4, title: "Lower middle-income economies" },
    "1": { x: 2 * width / 3 + 30, y: height / 1.4, title: "Low-income economies" },
    "0": { x: width + 100, y: height, title: "0" }
  }

  var devLevelCenters = {
    "5": { x: width / 3 - 50, y: height / 2.5 },
    "4": { x: width / 2 - 50, y: height / 2.5 },
    "3": { x: 2 * width / 3, y: height / 2.5 },
    "2": { x: width / 3 - 40, y: height / 1.5},
    "1": { x: 2 * width / 3 - 20, y: height / 1.35 },
    "0": { x: width + 100, y: height }
  };

  // Used when setting up force and
  // moving around nodes
  var damper = 0.102;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  // Charge is negative because we want nodes to repel.
  // Dividing by 8 scales down the charge to be
  // appropriate for the visualization dimensions.
  function charge(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  }

  // Here we create a force layout and
  // configure it to use the charge function
  // from above. This also sets some contants
  // to specify how the force layout should behave.
  // More configuration is done below.
  var force = d3.layout.force()
    .size([width, height])
    .charge(charge)
    .gravity(-0.01)
    .friction(0.9);


  // Nice looking colors - no reason to buck the trend
  var fillColor = d3.scale.ordinal()
    .domain(['Americas', 'Europe', 'Asia', 'Africa', 'Oceania', 'China'])
    .range(['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494']);

  // Sizes bubbles based on their area instead of raw radius
  var radiusScale = d3.scale.pow()
    .exponent(0.5)
    .range([5, dim / 8]);

  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    
    var myNodes = rawData.map(function (d) {
      if(d.country == "China") {
        var groupValue = d.country;
      }
      else {
        var groupValue = d.region;
      }

      return {
        id: d.id,
        radius: radiusScale(+d.value),
        value: d.value,
        name: d.country,
        group: groupValue,
        year: d.year,
        region: d.region,
        world_bank: d.group,
        gni: d.gni,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    d3.select(selector).select("svg").remove();
    // Use the max value in the data as the max in the scale's domain
    // note we have to ensure the value is a number by converting it
    // with `+`.
    // 

    var maxAmount = d3.max(rawData, function (d) { return +d.value; });
    radiusScale.domain([0, maxAmount]);

    nodes = createNodes(rawData);
    // Set the force's nodes to our newly created nodes array.
    force.nodes(nodes);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('id', function (d) { return d.name.replace(/\s+/g, ''); })
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)
      .on('touchend', hideDetail);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });


    // Create the legend
    var legendRectSize = 20;
    var legendSpacing = 15;
    var legend = svg
      .append("g")
      .selectAll("g")
      .data(fillColor.domain())
      .enter()
      .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
          var height = legendRectSize;
          var x = 40;
          var y = i * height + 10;
          return 'translate(' + x + ',' + y + ')';
    });

    // Draw rects, and color them by original_index
    legend.append('circle')
      .classed('scaleCircle', true)
      .attr('r', 5)
      .style('fill', fillColor)
      .style('stroke', d3.rgb(fillColor).darker());
   
    legend.append('text')
      .classed('scaleCircleLabel', true)
      .attr('x', 12)
      .attr('y', 20 - legendSpacing)
      .text(function(d) { return d; });

    // Set initial layout to single group.
    if(currentState == "split") {
      splitBubbles();
    }
    else {
      groupBubbles();
    }
  };

  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideLabels();

    force.on('tick', function (e) {
      bubbles.each(moveToCenter(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();

    currentState = "grouped";
  }

  /*
   * Helper function for "single group mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it toward the center of
   * the visualization.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToCenter(alpha) {
    return function (d) {
      d.x = d.x + (center.x - d.x) * damper * alpha;
      d.y = d.y + (center.y - d.y) * damper * alpha;
    };
  }

  /*
   * Sets visualization in "split by year mode".
   * The year labels are shown and the force layout
   * tick function is set to move nodes to the
   * yearCenter of their data's year.
   */
  function splitBubbles() {
    hideLabels();
    showLabels();

    force.on('tick', function (e) {
      bubbles.each(moveToSplitView(e.alpha))
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    force.start();

    currentState = "split";
  }

  /*
   * Helper function for "split by year mode".
   * Returns a function that takes the data for a
   * single node and adjusts the position values
   * of that node to move it the year center for that
   * node.
   *
   * Positioning is adjusted by the force layout's
   * alpha parameter which gets smaller and smaller as
   * the force layout runs. This makes the impact of
   * this moving get reduced as each node gets closer to
   * its destination, and so allows other forces like the
   * node's charge force to also impact final location.
   */
  function moveToSplitView(alpha) {
    return function (d) {
      if(currentView == "region") {
        var target = regionCenters[d.region];
      }
      else if(currentView == "gni") {
        var target = devLevelCenters[d.world_bank];
      }
      d.x = d.x + (target.x - d.x) * damper * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * damper * alpha * 1.1;
    };
  }

  /*
   * Hides Year title displays.
   */
  function hideLabels() {
    svg.selectAll('.year').remove();
    svg.selectAll('.devLevel').remove();
  }

  /*
   * Shows Labels as titles in split view displays.
   */
  function showLabels() {
    if(currentView == "region") {
      var yearsData = d3.keys(regionsTitleX);
      var years = svg.selectAll('.year')
        .data(yearsData);

      years.enter().append('text')
        .attr('class', 'year')
        .attr('x', function (d) { return regionsTitleX[d]; })
        .attr('y', function (d) { return regionsTitleY[d]; })
        .attr('text-anchor', 'middle')
        .text(function (d) { return d; });
    }
    else if (currentView == "gni") {
      var devLevelData = d3.keys(devLevelsInfo);
      var devLevels = svg.selectAll('.devLevel')
        .data(devLevelData);

      devLevels.enter().append('text')
        .attr('class', 'devLevel')
        .attr('x', function (d) { return devLevelsInfo[d]['x']; })
        .attr('y', function (d) { return devLevelsInfo[d]['y']; })
        .attr('text-anchor', 'middle')
        .text(function (d) { return devLevelsInfo[d]['title']; });
    }
  }

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Country: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">$' +
                  addCommas(d.value) +
                  ' million</span><br/>' +
                  '<span class="name">GNI per capita: </span><span class="value">$' +
                  addCommas(d.gni) +
                  '</span><br />' +
                  '<span class="name">Year: </span><span class="value">' +
                  d.year +
                  '</span>';
    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    currentView = displayName;
    if (displayName === 'region' || displayName === 'gni') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };

  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function displayIn(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('#toolbar .button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Toggle between in and out stock
 */
function setupTypeButtons() {
  d3.select('#type')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('#type .button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.

      if(buttonId == "out") {
        dataset = datasetOut;
      }
      else {
        dataset = datasetIn;
      }
      currentDataset = dataset;

      myBubbleChart('#vis', dataset[currentYear][currentRegionsState]);
    });
}

/*
 * Toggle between years
 */
function setupYearButtons() {
  d3.select('#years')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('#years .button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var year = button.attr('id');

      dataset = currentDataset;
      currentYear = year;
      myBubbleChart('#vis', dataset[year][currentRegionsState]);

    });
}

/*
  Toggle between regions
 */
function setupRegionFilter() {
  $("#regionFilter").contents().find(":checkbox").bind('change', function(){      
      checked = this.checked;
      value = $(this).val();
      if(checked == true) {

        currentRegionsArray.push(value);
        currentRegionsState = "Partial";

        // If currentDataset[currentYear]["Partial"] exists, merge into it, otherwise populate it
        if(currentDataset[currentYear][currentRegionsState].length) {
          $.merge(currentDataset[currentYear][currentRegionsState],currentDataset[currentYear][value]);
        }
        else {
          currentDataset[currentYear][currentRegionsState] = currentDataset[currentYear][value];
        }
      }
      else {
        var index = currentRegionsArray.indexOf(value);
        if (index > -1) {
            currentRegionsArray.splice(index, 1);
        } 

        for (var i = 0; i < currentDataset[currentYear][currentRegionsState].length; i++){
          if(currentDataset[currentYear][currentRegionState][i].region === value){
            delete currentDataset[currentYear][currentRegionState][i];
          }
        }

      }
      console.log(currentDataset[currentYear][currentRegionsState]);
      dataset = currentDataset;
      myBubbleChart('#vis', dataset[currentYear][currentRegionsState]);
  });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
// d3.csv('data/fdi-in.csv', display);

// var datasetIn, datasetOut, dataset;

// Stock in is our default data set
// d3.csv("data/fdi-in.csv", function(data) {
//   datasetIn = data;
//   dataset = datasetIn;
//   console.log(dataset);
//   myBubbleChart('#vis', datasetIn);
// });

// d3.csv("data/fdi-out.csv", function(data) {
//   datasetOut = data;
// });


// Define our global dataset variables.
var dataset;
var datasetIn = {
  2000:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2005:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2010:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2014:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  }
};
var datasetOut = {
  2000:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2005:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2010:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  },
  2014:{
    "All":[],
    "Partial":[],
    "Americas":[],
    "Europe":[],
    "Asia":[],
    "Africa":[],
    "Oceania":[]
  }
};
var defaultDataset = datasetOut;
var currentDataset = datasetOut;
var defaultYear = 2014;
var currentYear = 2014;
var currentState = "grouped";
var currentView = "all";
var countriesArray = [];
var regionsArray = {"Americas":[],"Europe":[],"Asia":[],"Africa":[],"Oceania":[]};
var currentRegionsArray = [];
var defaultRegionsState = "All";
var currentRegionsState = "All";

// Get our google spreadsheet
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1pVWQNwnHbEex4ycocZ_GqvDHY77l4slytcGaTpWwraE/pubhtml?gid=1343412411&single=true';
$(document).ready( function() {
  Tabletop.init( { key: public_spreadsheet_url,
                   callback: showInfo,
                   wanted: [ "FDI Data Source"],
                   debug: true } )
});

function showInfo(data, tabletop) {

  $.each( tabletop.sheets("FDI Data Source").all(), function(i, row) {
    Object.keys(datasetIn).forEach(function(key){
      Object.keys(datasetIn[key]).forEach(function(regionKey) {

        if(regionKey == "All") {
          if(row.in_stock && row.year == key) {
            datasetIn[key][regionKey].push({
              region: row.region,
              id: row.id,
              country: row.country,
              value: row.in_stock,
              group: row.group,
              year: key,
              gni: row.gni
            });
          }
        }
        else if(regionKey == "Partial") {
          return;
        }
        else {
          if(row.in_stock && row.year == key && row.region == regionKey) {
            datasetIn[key][regionKey].push({
              region: row.region,
              id: row.id,
              country: row.country,
              value: row.in_stock,
              group: row.group,
              year: key,
              gni: row.gni
            });
          }
        }
      });
    });

    Object.keys(datasetOut).forEach(function(key){
      Object.keys(datasetOut[key]).forEach(function(regionKey) {
        if(regionKey == "All") {
          if(row.out_stock && row.year == key) {
            datasetOut[key][regionKey].push({
              region: row.region,
              id: row.id,
              country: row.country,
              value: row.out_stock,
              group: row.group,
              year: key,
              gni: row.gni
            });
          }
        }
        else if(regionKey == "Partial") {
          return;
        }
        else {
          if(row.out_stock && row.year == key && row.region == regionKey) {
            datasetOut[key][regionKey].push({
              region: row.region,
              id: row.id,
              country: row.country,
              value: row.out_stock,
              group: row.group,
              year: key,
              gni: row.gni
            });
          }
        }
      });
    });


  //   Object.keys(datasetOut).forEach(function(key){
  //     if(row.out_stock && row.year == key) {
  //       datasetOut[key].push({
  //         region: row.region,
  //         id: row.id,
  //         country: row.country,
  //         value: row.out_stock,
  //         group: row.group,
  //         year: key,
  //         gni: row.gni
  //       });
  //     }
  //   });

  });

  dataset = defaultDataset;
  myBubbleChart('#vis', dataset[defaultYear][defaultRegionsState]);
}

function redraw() {
  myBubbleChart('#vis', dataset[currentYear][currentRegionsState]);
}

// Redraw based on the new size whenever the browser window is resized.
window.addEventListener("resize", redraw);

var countriesArray = ["Seychelles", "Sudan", "Zambia", "Kenya", "South Sudan", "Tanzania", "Zimbabwe", "Comoros", "Rwanda", "Uganda", "Mozambique", "Ethiopia", "Eritrea", "Madagascar", "Burundi", "Malawi", "Reunion", "Djibouti", "Somalia", "Equatorial Guinea", "Gabon", "Angola", "Congo", "Sao Tome and Principe", "Cameroon", "Chad", "Democratic Republic of the Congo", "Central African Republic", "Libya", "Algeria", "Tunisia", "Morocco", "Egypt", "Western Sahara", "Botswana", "South Africa", "Namibia", "Swaziland", "Lesotho", "Cape Verde", "Nigeria", "Ghana", "Cote dIvoire (IvoryCoast)", "Mauritania", "Senegal", "Benin", "Burkina Faso", "Sierra Leone", "Mali", "Togo", "Guinea-Bissau", "Guinea", "Gambia, The", "Niger", "Liberia", "Saint Helena", "Panama", "Costa Rica", "Mexico", "Belize", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Bermuda", "United States of America", "Canada", "Bahamas, The", "Trinidad and Tobago", "Puerto Rico", "Saint Kitts and Nevis", "Barbados", "Antigua and Barbuda", "Grenada", "Saint Lucia", "Dominica", "Saint Vincent and the Grenadines", "Dominican Republic", "Cuba", "Jamaica", "Haiti", "Guadeloupe", "Martinique", "Montserrat", "Saint Pierre and Miquelon", "Virgin Islands, British", "Virgin Islands, U.S.", "Aruba", "Cayman Islands", "Greenland", "Turks and Caicos Islands", "Uruguay", "Chile", "Argentina", "Venezuela", "Brazil", "Suriname", "Colombia", "Peru", "Ecuador", "Paraguay", "Guyana", "Bolivia", "Falkland Islands (Islas Malvinas)", "French Guiana", "Kazakhstan", "Turkmenistan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Macao", "Japan", "Hong Kong", "South Korea", "Taiwan", "China", "Mongolia", "North Korea", "Singapore", "Brunei", "Malaysia", "Thailand", "Indonesia", "Philippines", "Timor-Leste", "Vietnam", "Laos", "Myanmar", "Cambodia", "Iran", "Maldives", "Sri Lanka", "Bhutan", "India", "Pakistan", "Bangladesh", "Nepal", "Afghanistan", "Qatar", "Kuwait", "United Arab Emirates", "Israel", "Cyprus", "Saudi Arabia", "Bahrain", "Oman", "Turkey", "Lebanon", "Azerbaijan", "Iraq", "Jordan", "Armenia", "Georgia", "Syria", "Yemen", "State of Palestine", "Czech Republic", "Slovakia", "Poland", "Hungary", "Russian Federation", "Romania", "Bulgaria", "Belarus", "Ukraine", "Moldova", "Norway", "Sweden", "Denmark", "Finland", "Iceland", "Ireland", "United Kingdom", "Estonia", "Lithuania", "Latvia", "Faroe Islands", "Italy", "Spain", "Slovenia", "Greece", "Portugal", "Malta", "Croatia", "Montenegro", "Serbia", "Macedonia", "Bosnia and Herzegovina", "Albania", "Gibraltar", "Switzerland", "Luxembourg", "Netherlands", "Austria", "Germany", "Belgium", "France", "New Zealand", "Fiji", "Vanuatu", "Papua New Guinea", "Solomon Islands", "New Caledonia", "Kiribati", "Nauru", "Guam", "Tonga", "Samoa", "Cook Islands", "Niue", "American Samoa", "French Polynesia"];

  // constructs the suggestion engine
  var countries = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: countriesArray
  });

  $('#searchContainer .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'countries',
    source: countries
  });

  $('.typeahead').bind('typeahead:select typeahead:autocomplete', function(ev, suggestion) {
    var searchID = suggestion.replace(/\s+/g, '');

    if($("#" + searchID).length) {
      $('#'+searchID).trigger('mouseover');
      console.log('Selection: ' + suggestion);
      $('#'+searchID).triggerSVGEvent('mouseover').triggerSVGEvent('mousemove');
    }
    else {
      $('#noData').html("There is no data available for "+suggestion+" at this time.");
    }
  });

  $('.typeahead').bind('typeahead:change', function(ev, suggestion) {
    $('#noData').empty();
    $('#gates_tooltip').css('opacity','0');
  });

// setup the buttons.
setupButtons();
setupTypeButtons();
setupYearButtons();
setupRegionFilter();

$.fn.triggerSVGEvent = function(eventName) {
 var event = document.createEvent('SVGEvents');
 event.initEvent(eventName,true,true);
 this[0].dispatchEvent(event);
 return $(this);
};
