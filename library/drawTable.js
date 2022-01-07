 //take an array and make html table out of it
 //add functionality that dynamically filters rows in the table based on selection
function maketable(){
    //go through the full array and select columns (metrics) and rows (regions) that go into the table
    //for simplicity use a subset of rows and columns 
    //get a list of cbas that go into dropdown - need to turn it into unique list
    var outcome_array = scores_outcome.map(c=>c.EVENT);
    var allOutcome = outcome_array.filter((c, index)=>{
        return outcome_array.indexOf(c) === index;
    })
    
    //add options to the select button
    
    d3.select("#dropdown_table")
      .selectAll("myOptions")
      .data(allOutcome)
      .enter()
      .append("option")
      .text(function(d){return d});
    
      var cols = ['REGION', 'CBA', 'EVENT', 'POP_ENRL', 'POP_DUAL'];
      var col_types = ['name', 'name', 'name', 'number', 'number'];
      
      
      $min = $('#value-min');           // Minimum text input
      $max = $('#value-max');          // Maximum text input
  
      
  
    
      
      $('#slider').css({"margin": "30px 0 30px 0", "width": "50%"})
      $('#slider').noUiSlider({           // Set up the slide control
          range: [-3, 3], start: [-1, 1], handles: 2, margin: 0.1, connect: true, step: 0.1,
          serialization: {to: [$min, $max],resolution: 1}
        })
  

    
    function update_table(input){
        
        $('#score_table').empty();
        var $table = $('#score_table').css({"width": "50%"});;
        //add table header
        var $row_hdr = $('<thead></thead>')//.addClass('thead-dark')
        for(i = 0; i <cols.length; i++) {
            $th = $('<th>'+cols[i]+'</th>').attr('data-sort', col_types[i]);
            $row_hdr.append($th);
        };
        $table.append($row_hdr);


        /*

        $('#slider').css({"margin": "30px 0 30px 0", "width": "50%"})
        $('#slider').noUiSlider({           // Set up the slide control
            range: [-3, 3], start: [-1, 1], handles: 2, margin: 0.1, connect: true, step: 0.1,
            serialization: {to: [$min, $max],resolution: 1}
          }).change(function() { update($min.val(), $max.val()); });
        */

        var rows = [];
        var array = [];
        scores_outcome.forEach(element => {
            if (element.MONTH_WINDOW === 6 && element['EVENT'] === input ) {
                array.push(element);
            }
        });
        
        function update(min, max){
            rows.forEach(row => {
                if (row.area['POP_ENRL'] >= min && row.area['POP_ENRL'] <= max) {
                    row.$element.show();
                }
                else {
                    row.$element.hide();
                }
            });
    
            };
        
            $("#slider").on('change', function(d){
                update($min.val(), $max.val());
        });
       

        
        function makeRows(){
            for (i = 0; i < array.length; i++){
                var $row = $('<tr></tr>');
                for(j = 0; j <cols.length; j++) {
                    $row.append($('<td></td>').text(array[i][cols[j]]));
                }
                rows.push({
                    area : array[i],
                    $element: $row
                })
            }  
    
        };
    
    
        function appendRows(){
            var $tbody = $('<tbody></tbody>'); 
            rows.forEach(function(element){
                $tbody.append(element.$element);
            })
            $table.append($tbody);
        };
    


        
        function init() {                     // Tasks when script first runs
    
    
              makeRows();                           // Create table rows and rows array
              appendRows();                         // Add the rows to the table
              //update($min.val(), $max.val());     // Update table to show matches
          }
        
          init();                              // Call init() when DOM is ready
    
            /*
            create object called compare
            It will have 3 methods: Name and Number (sorting alphabetic fields and sorting numeric fields)
            Each method will have 2 parameters, a & b. Return:
            # -1 if value of a is lower than b
            # 0 if value is same
            # 1 if value of a is greater than b
            */
    

            const compare = {
                name: function(a, b){
                    if (a < b) {
                        return -1;
                    }
                    else {
                        return a > b ? 1 : 0;
                    }
                },
                number: function(a, b){
    
                    return a-b;
                }
            }
    
            //sort function
            //1. For each element that has a cl ass attribute with a va lue of sortable, run the anonymous function.
            function makeSortable(){
            //2. Store the current <table> in $table.
            $table = $('.sortable');
            //3. Store the table body in $tbody.
            $tbody = $table.find('tbody');
            //4 . Store the <th> elements in $controls.
            $controls = $table.find('th');
            //5. Put each row in $tbody into an array called rows.
            var rows =  $table.find('tr').toArray();
            //6. Add an event handler for when users click on a header. It should call an anonymous function.
            $controls.on('click', function(){
                    //7. $header stores that element in a jQuery object.
                    var $header = $(this) ;
                    //8. Store the value of that heading's data-sort attribute in an variable called order. 
                    //NoTE: We set data attrib as .attr('data-sort', 'Number') and then extract the data with .data('sort')
                    var order = $header.data('sort');
                    //9. Declare a variable called column.
                    var column;
                    //10. In the header the user clicked upon, if the class attribute has a value of ascending or descending, then it is already sorted by this column.
                    //11. Toggle the value of that class attribute (so that it shows the other value ascending/descending).
                    //12. Reverse the rows (stored in the rows array) using the reverse () method of the array.
                    if ($header.hasClass("ascending") || $header.hasClass("descending")) {
                        $header.toggleClass('ascending descending');
                        $tbody.append(rows.reverse());
                    }
                    else {
                        //13. Otherwise, if the row the user clicked on was not selected, add a class of ascending to the header.
                        $header.addClass('ascending');               
                        //14. Remove the class of ascending or descending from all other <th> elements on this table.
                        $header.siblings().removeClass('ascending descending'); 
                        //15. If the compare object has a method that matches the value of the data-type attribute for this column:
                        
                        if (compare.hasOwnProperty(order)) {  
                            //16. Get the column number using the index () method (it returns the index number of the element within a jQuery matched set). That value is stored in the column variable.
                        column = $controls.index(this);         
                        //17. The sort () method is applied to the array of rows and will compare two rows at a time. As it compares these values:
                        rows.sort(function(a, b) {               // Call sort() on rows array
                                //18. The values a and bare stored in variables: . find() gets the <td> elements for that row. . eq () looks for the cell in the row whose index number matches the column variable.
                                //. text() gets the text from that cell.
                                a = $(a).find('td').eq(column).text(); // Get text of column in row a
                                b = $(b).find('td').eq(column).text(); // Get text of column in row b
                                //19. The compare object is used to compare a and b. It will use the method specified in the type variable (which was collected from the data-sort attribute in step 6). 
                                return compare[order](a, b);           // Call compare method
                        });
                        $tbody.append(rows);
                    }
                }
            });
            };
            
            makeSortable();

    };

    $("#dropdown_table").on('change', function(d){
        
        // recover the option that has been chosen
        var table_outcome = $('#dropdown_table').chosen().val();

        // run the updateChart function with this selected option
        update_table(table_outcome);
    })
    $('#dropdown_table').attr("data-placeholder", "Choose an Outcome...").chosen({width: '300px'});


}

window.addEventListener('load', maketable);