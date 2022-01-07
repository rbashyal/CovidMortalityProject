
function drawline(){
    //go through the full array and select columns (metrics) and rows (regions) that go into the table
    //for simplicity use a subset of rows and columns 

    //month 
    const dataMonth = 663; 
    const dataStart = 603;
    //set up canvas
    const width = 850;
    const height = 500;
    const margin = 5;
    const padding = 5;
    const adj = 30;

        var svg = d3.select('#graph_here')
        .append('svg')
        .attr("width", width)
        .attr('height', height)
        .attr("style", "background-color: lightgrey")
        .attr("id", "chart")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
              + adj + " -"
              + adj + " "
              + (width + adj *3) + " "
              + (height + adj*3))
        .style("padding", padding)
        .style("margin", margin)

        var svg_legend = d3.select('#legends_here')
        .append('svg')
        .attr("width", 200)
        .attr('height', 200)
        .attr("style", "background-color: white")

      

       
    //get a list of cbas that go into dropdown - need to turn it into unique list
    var cba_array = data_outcome.map(d=>d.cba);
    var allGroup = cba_array.filter((d, index)=>{
        return cba_array.indexOf(d) === index;
    })
    
    //add options to the select button
    
    d3.select("#dropdown1")
      .selectAll("myOptions")
      .data(allGroup)
      .enter()
      .append("option")
      .text(function(d){return d})
    


    function update(_region_, _event_){
    
                        $('g').remove();
                        //build a color palette - since no domain is assigned each line is assigned the next unused color    
                        var scC = d3.scaleOrdinal(d3.schemeCategory10)                        

                        var dataFilter = data_outcome.filter(d=>{
                            return d.category === _event_ &&  _region_.includes(d.cba);
                        })
                        
                        //lines -- svg object type - as many lines as there are elements in array data_outcome    
                        //add an svg _region_ element for each element
                        
                        const lines = svg.selectAll("lines")
                            .data(dataFilter)
                            .enter()
                            .append("g")

                        const legend = svg_legend.selectAll("rect")
                            .data(dataFilter)
                            .enter()
                            .append("g")


                        legend.append('rect')
                            .attr('x', 10)
                            .attr('y', function(d, i){
                                return (i+1)*20
                            })
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('stroke', 'black')
                            .attr("fill", function(d, i){
                                return scC(i);
                            })
                        legend.append("text")
                        .attr('x', 30)
                        .attr('y', function(d, i){
                            return (i+1)*20+8
                        })
                        .text(function(d) {
                            return d.cba;
                        })
                        .style("font-size", "12px")
                        ;



                        //build fnction factories that scale the x and y values

                        const xScale = d3.scaleTime().range([0, width])
                        const yScale = d3.scaleLinear().rangeRound([height, 0])
                        xScale.domain([new Date(1960, dataStart), new Date(1960, dataMonth)]);
                        yScale.domain([0, d3.max(dataFilter, d=>{
                            return d3.max(d.y_value)*1.5    
                            })
                        ])
                        //build axis
                        const yAxis = d3.axisLeft().scale(yScale);
                        const xAxis = d3.axisBottom().scale(xScale)
                        .tickFormat(d3.timeFormat('%b %y'))
                        .ticks(10)
                        ;

                        svg.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0,"+(height)+")")
                        .call(xAxis)
                        

                        svg.append("g")
                        .attr("class", "axis")
                        .call(yAxis);


                        //array of xs and ys to draw the path
                        const line = d3.line()
                            .x(function(d, i) { return xScale(new Date(1960, 606+i)) })
                            .y(function(d, i) { return yScale(d); } );
                        
                        lines.append("path")
                            .attr("d", function(d) { return line(d.y_value); })
                            .attr("fill","none")
                            .style("stroke", function(d, i){
                                return scC(i);}
                            )
                            .style("stroke-width", "3px")
                        ;
    }

function getEvent(_selectedOutcome, _selectedPopulation){
    var _selected_cat = category_name.filter(item => item.numerator_long === _selectedOutcome && item.denom_long === _selectedPopulation );
    return _selected_cat[0].event;
}
// When the button is changed, run the updateChart function
$("#dropdown0_outcome,#dropdown0_population,#dropdown1").on('change', function(d){
    // recover the option that has been chosen
    var selectedRegion = $('#dropdown1').chosen().val(); 
    var _selectedOutcome = $('#dropdown0_outcome').chosen().val();
    var _selectedPopulation = $('#dropdown0_population').chosen().val();
    
    
    var selectedEvent = getEvent(_selectedOutcome, _selectedPopulation);


    // run the updateChart function with this selected option
    update(selectedRegion, selectedEvent);
})
//make the drop down pretty via the chosen library 
$('#dropdown1').attr("data-placeholder", "Choose a Region...").chosen({width: '300px'});
    

};

window.addEventListener('load', drawline);