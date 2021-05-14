function  drawBookChart(svgClass, books) {
  let height = 450;
  let width = 800;
  let margin = ({top: 0, right: 120, bottom: 34, left: 120});


  let svg = d3.select(svgClass)
  .attr("viewBox", `0 0 900 550`);
  

  books = books.filter(d => d.year != "");
  books = congregate_duplicates(books);

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
      year: "year published",
  };
  
  let chartState = {};
  
  chartState.measure = Count.total;
  chartState.scale = Scales.lin;
  chartState.legend = Legend.year;
  
  
  // Colors used for circles depending on course level
  let colors = d3.scaleOrdinal()
      .domain(["1000", "2000", "3000", "4000"])
      .range(['#C39B82','#D8BFAC','#A5A58F','#6C705E']);
  
  //different ways to filter data - currently only gender is an option
  var allGroup = ["gender"];

  d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(allGroup)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; }) // corresponding value returned by the button
        
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
  let genders = ["male", "female", "all"]

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
    .on('click', function(event, d) {
        handleBarLegendChange(d, ".gender_options");
        svg.selectAll(".books").remove();
        if(d == "female"){
            filter_value = "female"
            redraw(false)
        } else if(d == "male") {
            filter_value = "male"
            redraw(false)
        } else {
            filter_value = null;
            redraw(false);
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

  
    // Create tooltip 
    let tooltip = addTooltipToVis("heightSvg_tooltip");
  
    let dataSet = books;

  
    // Set chart domain max value to the highest total value in data set
    xScale.domain(d3.extent(dataSet, function (d) {
        return +d.year;
    }));

    redraw();
  

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
        // Set X axis based on new scale. 
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

        // Create circles for books
        let bookCircles = svg.selectAll(".books")
            .data(dataSet, function(d) { return d.title });

        bookCircles.exit()
            .transition()
            .duration(duration)
            .attr("cx", 0)
            .attr("cy", (height / 2) - margin.bottom / 2)
            .remove();

        bookCircles.enter()
            .append("circle")
            .attr("class", "books")
            .attr("cx", 0)
            .attr("cy", (height / 2) - margin.bottom / 2)
            .attr("r", function(d) {return 6 * d.count})
            .attr("fill", function(d){
                if(filter_value!= null){ 

                if(d[filter_field] != filter_value){
                    return lightGreyColor;
                } else {
                    let class_level = d.course_number.substring(d.course_number.indexOf(" "));
                    class_level = class_level.substring(1, 2) + "000";
                        return colors(class_level)}

                } else {
                    let class_level = d.course_number.substring(d.course_number.indexOf(" "));
                    class_level = class_level.substring(1, 2) + "000";
                        return colors(class_level)}
                })
            .merge(bookCircles)
            .transition()
            .duration(duration * 2)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // Show tooltip when hovering over circle (data for book)
        d3.selectAll(".books").on("mousemove", function(event, d) {
            let tooltipText = "<i>" + "<b>"+ d.title +"</b>"+ "</i><br />"+
                            "author:  " + "<b>" + d.author + "</b><br />" +
                            "course: <b>" + d.course_number + "<b><br />" +
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
                  return class_level == checkedBoxes[i];
              });
              Array.prototype.push.apply(newData, newArray);
          }
  
          dataSet = newData;
          redraw();
      }
}

//for books that are tuught by more than one class, merge entries and increase count
function congregate_duplicates(books){
    non_duplicated_list = [];
    book_count = {};
    title_to_index = {}
    for(let i = 0; i < books.length; i++){
        if(!(books[i].title in book_count)){
            book_count[books[i].title] = 1;
            non_duplicated_list.push(books[i])
            title_to_index[books[i].title] = non_duplicated_list.length - 1;
        } else {
            book_count[books[i].title] += 1;
            non_duplicated_list[title_to_index[books[i].title]].course_number =  
            non_duplicated_list[title_to_index[books[i].title]].course_number + " & "+
            books[i].course_number;
        }
    }
    for(let i = 0; i < non_duplicated_list.length; i ++ ){
        non_duplicated_list[i].count = book_count[non_duplicated_list[i].title];
    }
    return non_duplicated_list;

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
    console.log(circle_id);
    console.log(d);
    d3.selectAll(circle_id)
      .transition()
      .duration(500)
      .style("fill", "#f8f8f8");
  
    d3.select("#key_" + d)
      .transition()
      .duration(500)
      .style("fill", darkTextColor);
  }
  