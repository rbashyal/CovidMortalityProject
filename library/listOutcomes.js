function listOutcomes(){

    //get a list of outcomes that go into dropdown - need to turn it into unique list
    var outcome_array = scores_outcome.map(d=>d.EVENT);
    var allOutcome = outcome_array.filter((d, index)=>{
        return outcome_array.indexOf(d) === index;
    })
    //further restrict to those outcomes present in score table

    var population_array = category_name.map(d=>d.denom_long);
    var allPopulation = population_array.filter((d, index)=>{
        return population_array.indexOf(d) === index;
    })

    d3.select("#dropdown0_outcome")
        .selectAll("myOutcome")
        .data(allOutcome)
        .enter()
        .append("option")
        .text(function(d){return d});
    
    $('#dropdown0_outcome').attr("data-placeholder", "Choose an Outcome...").chosen({width: '300px'});

    d3.select("#dropdown0_population")
        .selectAll("myPopulation")
        .data(allPopulation)
        .enter()
        .append("option")
        .text(function(d){return d});
    
    $('#dropdown0_population').attr("data-placeholder", "Choose a Population...").chosen({width: '300px'});


};
window.addEventListener('load', listOutcomes);