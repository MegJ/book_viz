function  drawCoursesChart(svgClass, books) {
  console.log("hi")
  let height = 400;
  let width = 800;
  let margin = ({top: 0, right: 120, bottom: 34, left: 40});
  
  console.log(books);
  // Data structure describing chart scales
  let Scales = {
      lin: "scaleLinear",
      log: "scaleLog"
  };
  
  // Data structure describing volume of displayed data
  let Count = {
      total: "year",
      perCap: "perCapita"
  };
  
  // Data structure describing legend fields value
  let Legend = {
      total: "Total Deaths",
      perCap: "Per Capita Deaths"
  };
  
  let chartState = {};
  
  chartState.measure = Count.total;
  chartState.scale = Scales.lin;
  chartState.legend = Legend.total;
  
  
  // Colors used for circles depending on continent
  let colors = d3.scaleOrdinal()
      .domain(["1000", "2000", "3000", "4000"])
      .range(['#D81B60','#1976D2','#388E3C','#FBC02D']);
  


//   d3.select("#color1000").style("color", colors("asia"));
//   d3.select("#color2000").style("color", colors("\\a"));
//   d3.select("#color3000").style("color", colors("northAmerica"));
//   d3.select("#color4000").style("color", colors("southAmerica"));

  let svg = d3.select(svgClass)
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  
  let xScale = d3.scaleLinear()
      .range([margin.left, width - margin.right]);
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")");
  
  // Create line that connects circle and X axis
  let xLine = svg.append("line")
      .attr("stroke", "rgb(96,125,139)")
      .attr("stroke-dasharray", "1,2");


  //create display legend
  let genders = ["male", "female"]

  
  let legend = genders;
  d3.select(svgClass).append("g")
    .selectAll(".key")
    .data(legend)
    .enter()
    .append("circle")
    .attr("class", "gender_options")
    .attr('id', function(d, i) { return "key_" + d;})
    .attr('cx', function(d, i) { return width - (margin.right/2);})
    .attr('cy', function(d, i) { return 90+ i*25;})
    .attr('r', 8)
    .style('fill', '#f8f8f8')
    .style('stroke', darkTextColor)
    .style('stroke-width', 2)
    .on('click', function(d, i) {
        handleBarLegendChange(d, ".gender_options");
        svg.selectAll(".books").remove();
        if(d == "female"){
            filter_value = "female"
            redraw(false)
        } else {
            filter_value = "male"

            redraw(false)
        }
    });

    let filter_field = "gender";
    let filter_value = "female"

    handleBarLegendChange("female", ".gender_options");


    d3.select(svgClass).append("g")
    .selectAll('.key_labels')
    .data(legend)
        .enter()
        .append('text')
        .attr('x', function(d, i) { return width-(margin.right/2) + 15;})
        .attr('y', function(d, i) { return 92 + i*25;})
        .text(function(d) {return d;})
        .style('fill', darkTextColor)
        .style("font-weight", "bold")
        .style("font-family", "Inconsolata")
        .style("font-size", "12px");

    // handleBarLegendChange("Women", ".gender_options");
  
  // Create tooltip div and make it invisible
  let tooltip = addTooltipToVis("heightSvg_tooltip");

  // Load and process data
  
      let dataSet = books;

      console.log(dataSet);
  
      // Set chart domain max value to the highest total value in data set
      xScale.domain(d3.extent(dataSet, function (d) {
          return +d.year;
      }));




  
      redraw();
  
      // Listen to click on "total" and "per capita" buttons and trigger redraw when they are clicked
      d3.selectAll(".measure").on("click", function() {
          let thisClicked = this.value;
          chartState.measure = thisClicked;
          if (thisClicked === Count.total) {
              chartState.legend = Legend.total;
          }
          if (thisClicked === Count.perCap) {
              chartState.legend = Legend.perCap;
          }
          redraw();
      });
  
    //   Listen to click on "scale" buttons and trigger redraw when they are clicked
      d3.selectAll(".scale").on("click", function() {
          chartState.scale = this.value;
          redraw(chartState.measure);
      });
  
      // Trigger filter function whenever checkbox is ticked/unticked
      d3.selectAll("input").on("change", filter);
  
      function redraw(transition=true) {
          if(transition){
              duration = 1000;
          } else {
              duration = 0;
          }

  
          // Set scale type based on button clicked
          if (chartState.scale === Scales.lin) {
              xScale = d3.scaleLinear().range([ margin.left, width - margin.right ])
          }
  
          if (chartState.scale === Scales.log) {
              xScale = d3.scaleLog().range([ margin.left, width - margin.right ]);
          }
          console.log(chartState.measure)
  
          xScale.domain(d3.extent(dataSet, function(d) {
              return +d[chartState.measure];
          }));
  
          let xAxis;
          // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point
          if (chartState.measure === Count.perCap) {
              xAxis = d3.axisBottom(xScale)
                  .ticks(10, ".1f")
                  .tickSizeOuter(0);
          }
          else {
              xAxis = d3.axisBottom(xScale)
                  .ticks(10)
                  .tickSizeOuter(0);
          }
  
          d3.transition(svg).select(".x.axis")
              .transition()
              .duration(duration)
              .call(xAxis);
  
          // Create simulation with specified dataset
          let simulation = d3.forceSimulation(dataSet)
              // Apply positioning force to push nodes towards desired position along X axis
              .force("x", d3.forceX(function(d) {
                  // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                  return xScale(+d[chartState.measure]);  // This is the desired position
              }).strength(2))  // Increase velocity
              .force("y", d3.forceY((height / 2) - margin.bottom / 2))  // // Apply positioning force to push nodes towards center along Y axis
              .force("collide", d3.forceCollide(function(d){return 9 + (9 * .5 * (d.count - 1))})) // Apply collision force with radius of 9 - keeps nodes centers 9 pixels apart
              .stop();  // Stop simulation from starting automatically
  
          // Manually run simulation
          for (let i = 0; i < dataSet.length; ++i) {
              simulation.tick(10);
          }
  
          // Create country circles
          let countriesCircles = svg.selectAll(".books")
              .data(dataSet, function(d) { return d.title });

          console.log(countriesCircles.exit());
          countriesCircles.exit()
              .transition()
              .duration(duration)
              .attr("cx", 0)
              .attr("cy", (height / 2) - margin.bottom / 2)
              .remove();
  
          countriesCircles.enter()
              .append("circle")
              .attr("class", "books")
              .attr("cx", 0)
              .attr("cy", (height / 2) - margin.bottom / 2)
              .attr("r", function(d) {return 6 * d.count})
              .attr("fill", function(d){ 

                    if(d[filter_field] != filter_value){
                        return lightGreyColor;
                    } else {
                        let class_level = d.course_number.substring(d.course_number.indexOf(" "));
                        class_level = class_level.substring(1, 2) + "000";
                          return colors(class_level)}

                    })
              .merge(countriesCircles)
              .transition()
              .duration(duration * 2)
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
  
          // Show tooltip when hovering over circle (data for respective country)
          d3.selectAll(".books").on("mousemove", function(d) {
              let tooltipText = "<i>" + "<b>"+ d.title +"</b>"+ "</i><br />"+
                                "author:  " + "<b>" + d.author + "</b><br />" +
                                "course: <b>" + d.course_number + " " +  d.course_title + "<b><br />" +
                                "year published: <b>" + d.year;

              updateToolTipText(tooltip, tooltipText, -20, 110);
  
              xLine.attr("x1", d3.select(this).attr("cx"))
                  .attr("y1", d3.select(this).attr("cy"))
                  .attr("y2", (height - margin.bottom))
                  .attr("x2",  d3.select(this).attr("cx"))
                  .attr("opacity", 1);
  
          }).on("mouseout", function(_) {
              hideTooltip(tooltip, "testing");
              xLine.attr("opacity", 0);
          });
  
      }
  
      // Filter data based on which checkboxes are ticked
      function filter() {
  
          function getCheckedBoxes(checkboxName) {
  
              let checkboxes = d3.selectAll(checkboxName).nodes();
              let checkboxesChecked = [];
              for (let i = 0; i < checkboxes.length; i++) {
                  if (checkboxes[i].checked) {
                      checkboxesChecked.push(checkboxes[i].defaultValue);
                  }
              }
              return checkboxesChecked.length > 0 ? checkboxesChecked : null;
          }
  
          let checkedBoxes = getCheckedBoxes(".continent");

          console.log(checkedBoxes)
  
          let newData = [];
  
          if (checkedBoxes == null) {
              dataSet = newData;
              redraw();
              return;
          }
  
          for (let i = 0; i < checkedBoxes.length; i++){
              let newArray = books.filter(function(d) {
                  let class_level = d.course_number.substring(d.course_number.indexOf(" "));
                  class_level = class_level.substring(1, 2) + "000";
                  console.log(class_level);
                  console.log(checkedBoxes[i]);
                  console.log(class_level == checkedBoxes[i]);
                  return class_level == checkedBoxes[i];
              });
              Array.prototype.push.apply(newData, newArray);
          }
  
          dataSet = newData;
          console.log(dataSet);
          redraw();
      }
  

    
}

function addTooltipToVis(className) {
    return d3.select("body")
      .append("div")
      .attr("class", className)
      .style("padding", 10)
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .attr("white-space", "pre-line")
      .style("background-color", "#fbfbfb")
      .style("border-radius", "5px")
      .style("border", "1px solid #cdcdcd");
  }
  
  function updateToolTipText(tooltip, tooltipText, topOffset, leftOffset) {
    tooltip
      .html(tooltipText)
      .style("font-family", "Montserrat")
      .style("font-size", "12px")
      .style("visibility", "visible")
      .style("max-width", 150)
      .style("top", function() { return event.pageY - topOffset + "px"; })
      .style("left", function() { return event.pageX - leftOffset +"px"; });
  }
  
  function hideTooltip(tooltip, className) {
    tooltip.style("visibility", "hidden");
    d3.selectAll(className).remove();
  }

  function handleBarLegendChange(d, circle_id) {
    d3.selectAll(circle_id)
      .transition()
      .duration(500)
      .style("fill", "#f8f8f8");
  
    d3.select("#key_" + d)
      .transition()
      .duration(500)
      .style("fill", darkTextColor);
  }
  