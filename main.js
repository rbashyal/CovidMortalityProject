function drawline(){

   
      //-----------------SVG-----------------------//

      const width = 950;
      const height = 500;
      const margin = 10;
      const padding = 10;
      const adj = 55;
      const svg = d3.select("#canvas")
      .append("svg")
      .attr('width', width)
      .attr("height", height)
      .style('background', "#F5F5F5")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "-"
          + (adj+30) + " -"
          + adj + " "
          + (width + adj*3 ) + " "
          + (height + adj*2))
      //.style("padding", padding)
      //.style("margin", margin)
      //legend

      var svg_legend = d3.select('#legends_here')
      .append('svg')
      .attr("width", 200)
      .attr('height', 200)
      .attr("style", "background-color: white")
      //--------------------time conversion-------------------------------------
          const timeConv = d3.timeParse("%Y-%m-%d")
      
      
      //------------------------------DROPDOWN--------------------------------------//
      
          //get a list of states that go into dropdown - need to turn it into unique list
          var state_array = data.map(d=>d.st);
          var allGroup = state_array.filter((d, index)=>{
              return state_array.indexOf(d) === index;
          })

          
          //initially the empty axes will be tailored to max min values of an example state - CA
          var dataFilter = data.filter(d=>{
            return d.st === "California";
          });



        //--------------------SCALES PREP------------------------------//
        const xScale = d3.scaleTime().range([0, width]);
        const yScale = d3.scaleLinear().range([height, 0]);
        xScale.domain([timeConv(d3.extent(dataFilter[0].last_day)[0])
                    , timeConv(d3.extent(dataFilter[0].last_day)[1])]);


        yScale.domain(
          [
            d3.min(dataFilter, function(d){ return d3.min(d.CI_DEATH_VACC1_LOW.concat(d.CI_DEATH_VACC0_LOW, d.cum_deaths))})
          , d3.max(dataFilter, function(d){return d3.max(d.CI_DEATH_VACC1_HIGH.concat(d.CI_DEATH_VACC0_HIGH, d.cum_deaths))})
          ]
        )
        //--------------------AXES------------------------------------//

        const yaxis = d3.axisLeft().scale(yScale);
        const xaxis = d3.axisBottom().scale(xScale)
        //.ticks(d3.timeDay.every(14))
        .tickFormat(d3.timeFormat("%b %d %y"));

        svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, "+height + ")")
        .call(xaxis);

        svg.append("g")
        .attr("class", "axis")
        .call(yaxis)
      
        svg.append("text")
        .attr("transform", "rotate(-90)")
        .text("Cumulative COVID-19 Deaths")
        .attr("x", -200)
        .attr("y", 1)
        .attr("dy", "1em")
        .attr("font-size", "110%")
        .style("font-family", "Georgia")
        ;

        d3.selectAll('.tick text')
          .attr("font-size", "150%")
          .style("font-family", "Georgia")


        //add options to the select button
        d3.select("#dropdown1")
        .selectAll("myOptions")
        .data(allGroup)
        .enter()
        .append("option")
        .text(function(d){return d})          
        
    //------------------------------------------------UPDATOR FUNCTION- REDRAW CHART ON EACH SELECTION CHANGE----------------------------------------------------------------//  
  
    function update(selectedGroup){
    
            $('g').remove();
            var dataFilter = data.filter(d=>{
                return selectedGroup.includes(d.st);
            })

            var $radios = $('input:radio[name = trueToll]');
            $radios.filter('[value = no]').prop('checked', true);

          //--------------------SCALES PREP------------------------------//
          const xScale = d3.scaleTime().range([0, width]);
          const yScale = d3.scaleLinear().range([height, 0]);
          xScale.domain([timeConv(d3.extent(dataFilter[0].last_day)[0])
                      , timeConv(d3.extent(dataFilter[0].last_day)[1])]);


          yScale.domain(
            [
              d3.min(dataFilter, function(d){ return d3.min(d.CI_DEATH_VACC1_LOW.concat(d.CI_DEATH_VACC0_LOW, d.cum_deaths))})
            , d3.max(dataFilter, function(d){return d3.max(d.CI_DEATH_VACC1_HIGH.concat(d.CI_DEATH_VACC0_HIGH, d.cum_deaths))})
            ]
          )
          //--------------------AXES------------------------------------//

          const yaxis = d3.axisLeft().scale(yScale);
          const xaxis = d3.axisBottom().scale(xScale)
          //.ticks(d3.timeDay.every(14))
          .tickFormat(d3.timeFormat("%b %d %y"));

          svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0, "+height + ")")
          .call(xaxis);

          svg.append("g")
          .attr("class", "axis")
          .call(yaxis)
          ;

          d3.selectAll('.tick text')
            .attr("font-size", "150%")
            .style("font-family", "Georgia")

          //--------------------LINE CONSTRUCTOR------------------------//

            const area = d3.area()
              .x(function(d) {return xScale(d.last_day);})
              .y0(function(d) {return yScale(d.CI_DEATH_VACC1_LOW);})
              .y1(function(d) {return yScale(d.CI_DEATH_VACC1_HIGH);})

              const line = d3.line()
              .x(function(d) {return xScale(d.last_day);})
              .y(function(d) {return yScale(d.DEATH_VACC1);})

              const area0 = d3.area()
              .x(function(d) {return xScale(d.last_day);})
              .y0(function(d) {return yScale(d.CI_DEATH_VACC0_LOW);})
              .y1(function(d) {return yScale(d.CI_DEATH_VACC0_HIGH);})

              const line0 = d3.line()
              .x(function(d) {return xScale(d.last_day);})
              .y(function(d) {return yScale(d.DEATH_VACC0);})

              const line_true = d3.line()
              .x(function(d) {return xScale(d.last_day);})
              .y(function(d) {return yScale(d.cum_deaths);})

            //----------DATA TO (X, Y) TUPLES FOR LINE----------------------------//
            

            var newList = dataFilter.map(function(item) {

                  return item.last_day.map(function(d, i) {
                      return {last_day:timeConv(d)
                            , last_day_raw:d
                            , cum_deaths: item.cum_deaths[i]
                            , CI_DEATH_VACC1_LOW:item.CI_DEATH_VACC1_LOW[i]
                            , DEATH_VACC1:item.DEATH_VACC1[i]
                            , CI_DEATH_VACC1_HIGH:item.CI_DEATH_VACC1_HIGH[i]
                            , CI_DEATH_VACC0_LOW:item.CI_DEATH_VACC0_LOW[i]
                            , DEATH_VACC0:item.DEATH_VACC0[i]
                            , CI_DEATH_VACC0_HIGH:item.CI_DEATH_VACC0_HIGH[i]
                          
                          }

                  })
            })
            //build a color palette - since no domain is assigned each line is assigned the next unused color    
            var scC = d3.scaleOrdinal(d3.schemeCategory10)
            //-------------------Identify N Series (States) to Draw: Chart allows multiple states to be selected-------------------//
            const lines = svg.selectAll("lines")
              .data(newList)
              .enter()
              .append("g")
              ;
                    
              lines.append("path")
              .attr("d", area )
              .attr("stroke", "none")
              .attr("fill", "#cce5df")
              .attr("fill-opacity", "0.4")

              lines.append("path")
              .attr("d", line)
              .attr("stroke", function(d, i){
                return scC(i);
              })
              .attr("fill", "none")
              .attr("stroke-width", '2')
              .attr("stroke-dasharray", ("2")) 


              lines.append("path")
              .attr("d", area0 )
              .attr("stroke", "none")
              .attr("fill", "#cce5df")
              .attr("fill-opacity", "0.4")

              lines.append("path")
              .attr("d", line0)
              .attr("stroke", function(d, i){
                return scC(i);
              })
              .attr("fill", "none")
              .attr("stroke-dasharray", ("6,6"))

              //------------------append label at end of line --------------//  
              //bind to each 'lines' the final data point in our data series 

              const add_label = function(text, em, outcome){

                lines.append("text")
                .datum(function(d){
                  return{
                    xval: d[d.length-1].last_day
                    ,yval: d[d.length-1][outcome]
                  };
                })
                .text(text)
                 .attr("transform", function(d) {
                  return "translate(" + (xScale(d.xval) + -70)  
                  + "," + (yScale(d.yval) -40 ) + ")";})
                .attr("dy", em)
                .style("font-family", "Georgia")
                ;
              }; 
              add_label("Predicted Deaths", "0em", "DEATH_VACC0")
              add_label("Without Vaccines", "1em", "DEATH_VACC0")

              add_label("Predicted Deaths", "0em", "DEATH_VACC1")
              add_label("With Vaccines", "1em", "DEATH_VACC1")

            //switch to toggle between showing and hiding actual death toll
            
            d3.selectAll("input[name=trueToll]").on("change", function(d){

              $('.trueTollLine').remove();
              // value of selected radio
              var value = this.value;

              if (value == "yes"){
                    lines.append("path")
                  .attr("class", "trueTollLine")
                  .attr("d", line_true)
                  .attr("stroke", "steelblue")
                  .attr("fill", "none")
                  .attr("stroke-width", '2')
                  .attr("opacity", 1);
              }
              else {
                lines.append("path")
                .attr("class", "trueTollLine")
                .attr("d", line_true)
                .attr("stroke", "steelblue")
                .attr("fill", "none")
                .attr("stroke-width", '2')
                .attr("opacity", 0);
                
              }
      
      });

      //----------------------------------add Tooltip-----------------------------------//
            /*****************
              1. add points on top of the lines 
              2. add circles surrounding the points  (initially hidden)
              3. add mouseover action 
            ****************/
            
              const tooltip = d3.select("body")
              .append("div")
              .attr("class", "tooltip")
              .attr("opacity", 0)
              .attr("position", "absolute")
              .style("fill", "#2b2929")
              .style("font-family", "Georgia")
              .style("font-size", "95%")

              const  var_list = ["DEATH_VACC1", "DEATH_VACC0"];

              for(const item of var_list) {

              lines.selectAll("points")
              .data(function(d){return d})
              .enter()
              .append("circle")
              .attr("cx", function(d){return xScale(d.last_day)})
              .attr("cy", function(d){return yScale(d[item])})

              .attr("r", 1)
              .attr("class", "point")
              .attr("opacity", 0)
              .attr("stroke", "none")
              .attr("fill", "#9c9c9c")

              lines.selectAll("circles")
              .data(function(d){return d})
              .enter()
              .append("circle")
              .attr("cx", function(d){return xScale(d.last_day)})
              .attr("cy", function(d){return yScale(d[item])})
              .attr("r", 15)
              .attr("class", "point")
              .attr("opacity", 0)
              .attr("stroke", "none")
              .on("mouseover", function(d){
              tooltip.transition()
              .delay(30)
              .duration(200)
              .style("opacity", 1);

              tooltip.html(d.last_day_raw+"<br>"+d3.format(",")(d[item]))
              .style("left", (d3.event.pageX + 25) + "px")
              .style("top", (d3.event.pageY)+"px")

              const selection = d3.select(this).raise();
              selection
              .transition()
              .delay("20")
              .duration("200")
              .attr("r", 10)
              .style("opacity", 1)
              .style("fill", "#ed3700")
              })
              .on("mouseout", function(){
              tooltip.transition()
              .duration(100)
              .style("opacity", 0)

              const selection = d3.select(this);

              selection.transition()
              .delay("20")
              .duration("200")
              .attr("r", 10)
              .style("opacity", 0)
              });
              }


      }

  // When the button is changed, run the updateChart function
  $("#dropdown1").on('change', function(d){
    // recover the option that has been chosen
    var selectedOption = $('#dropdown1').chosen().val();
    // run the updateChart function with this selected option
    update(selectedOption)
  })
  $('#dropdown1').attr("data-placeholder", "Choose a Region...").chosen({width: '300px'});
  

  

      
  


};