var d3 = d3|| {};
d3.ColorScaleChooser = function(){
  var squareWidth = 80, squareHeight = 30;
  var scaleValues = [];
  var parent = null;
  var dispatcher = d3.dispatch("change");
  var title = null;
  var addText = "Add";
  var yOffset = 0;

  function ColorScaleChooser(g){
    parent = g;


    if(title){
      g.append("text")
      .attr("x", 5)
      .attr("y", 15)
      .style("fill", "#666")
      .style("font-size", (0.6*squareHeight)+"px")
      .style("font-family", "Verdana")
      .text(title);

    yOffset = 0.6*squareHeight;
    }

    var addGroup = g.append("g")
    .attr("transform","translate(10, "+(10+yOffset)+")")
    .on("click", function(){
      var newValue = {value: 0, color: "#ffffff"};
      scaleValues.push(newValue);
      draw();
      form(newValue);
    });

    addGroup.append("rect")
    .attr("width", squareWidth)
    .attr("height", squareHeight)
    .attr("x", 0)
    .attr("y", 0)
    .style("fill","#ddd")
    .style("stroke", "#666");

    addGroup.append("path")
    .attr("d", "m -4.5,-20.5 0,16 -16,0 0,7 16,0 0,16 7,0 0,-16 16,0 0,-7 -16,0 0,-16 -7,0 z")
    .attr("transform","translate("+squareWidth/2+","+squareHeight/2+") scale("+(0.6*squareHeight/40)+")")
    .style("stroke", "#666")
    .style("fill", "#ffffff");

    addGroup.append("text")
    .attr("x", squareWidth + squareWidth/8)
    .attr("y", 30*squareHeight/40)
    .style("fill", "#666")
    .style("font-size", (0.425*squareHeight)+"px")
    .style("font-family", "Verdana")
    .text(addText);

    draw();
  }

  ColorScaleChooser.squareWidth = function(_){
    squareWidth = _;
    return ColorScaleChooser;
  };

  ColorScaleChooser.squareHeight = function(_){
    squareHeight = _;
    return ColorScaleChooser;
  };

  ColorScaleChooser.scaleValues = function(_){
    scaleValues = _;
    return ColorScaleChooser;
  };

  ColorScaleChooser.title = function(_){
    title = _;
    return ColorScaleChooser;
  };

  ColorScaleChooser.addText = function(_){
    addText = _;
    return ColorScaleChooser;
  };

  ColorScaleChooser.on = function(){
    var value = dispatcher.on.apply(dispatcher, arguments);
    return value === dispatcher ? ColorScaleChooser : value;

  };


  function draw(){

    var colorSelection = parent.selectAll(".step")
    .data(scaleValues.sort(function(a, b){
        return a.value-b.value;
    }), function(d) { return(d.value+d.color); });


    var colorSelectionEnter = colorSelection
    .enter()
    .append("g")
    .attr("class","step")
    .attr("transform", function(d, i){return"translate(10, "+((i+1)*squareHeight*1.1 + 10 + yOffset)+")";})
    .on("mouseover", function(){
      d3.select(this)
        .selectAll(".close")
        .style("visibility", "visible");
    })
    .on("mouseout", function(){
      d3.select(this)
        .selectAll(".close")
        .style("visibility", "hidden");
    });

    colorSelectionEnter.append("rect")
    .attr("width", squareWidth)
    .attr("height", squareHeight)
    .attr("x", 0)
    .attr("y", 0)
    .style("fill",function(d){ return d.color;})
    .style("stroke", "#000")
    .on("click", function(d){ form(d);});



    colorSelectionEnter.append("text")
    .attr("x", squareWidth + squareWidth/8)
    .attr("y", 30*squareHeight/40)
    .style("fill", "#333")
    .style("font-size", (0.425*squareHeight)+"px")
    .style("font-family", "Verdana")
    .text(function(d){return d.value;});

    colorSelectionEnter.append("path")
    .attr("class", "close")
    .attr("d", "m 20.5,1.86 a 20,20 0 0 0 -20,20 20,20 0 0 0 20,20 20,20 0 0 0 20,-20 20,20 0 0 0 -20,-20 z m -9.88,9 4.24,0 5.8,7.79 5.8,-7.79 4.23,0 -7.9,10.64 8.32,11.23 -4.23,0 -6.36,-8.59 -6.36,8.59 -4.23,0 8.49,-11.4 -7.77,-10.42 z")
    .style("fill", "#f00")
    .style("stroke", "#000")
    .style("visibility", "hidden")
    .attr("transform", "translate(3,3) scale(0.5)")
    .on("click", function(d){
      scaleValues = scaleValues.filter(function ( obj ) {
        return obj.value !== d.value;
      });
      draw();
    });

    colorSelection.exit()
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .remove();

    colorSelection
      .transition()
      .delay(1000)
      .duration(1000)
      .attr("transform", function(d, i){return"translate(10, "+((i+1)*squareHeight*1.1 + 10 + yOffset)+")";});

    dispatcher.call("change", {},
              scaleValues,
              scaleValues.reduce(function(a, b){return a.value < b.value ? a : b ;}).value,
              scaleValues.reduce(function(a, b){return a.value > b.value ? a : b ;}).value);
  }

  function form(obj){
    console.info(d3.event.pageX, d3.event.pageY);
    d3.selectAll(".colorScaleForm")
      .remove();

    var formDiv = d3.select("body")
      .append("div")
      .attr("class", "colorScaleForm")
      .style("position", "absolute")
      .style("left", (20+d3.event.pageX)+"px")
      .style("top", d3.event.pageY+"px")
      .style("background-color","rgba(128, 128, 128, 0.55)")
      .style("border-radius","5px")
      .style("padding","5px");

    formDiv.append("label")
    .text("Value");

    formDiv.append("input")
    .attr("class", "valueField")
    .attr("type", "number")
    .attr("step", "any")
    .attr("size", 10)
    .attr("value", obj.value);

    formDiv.append("label")
    .text("Color");

    formDiv.append("input")
    .attr("class", "colorField")
    .attr("type", "color")
    .attr("value", obj.color);

    formDiv.append("button")
    .text("Set")
    .on("click", function(){
      scaleValues[scaleValues.indexOf(obj)] = {value: formDiv.select(".valueField").node().value,
                                              color: formDiv.select(".colorField").node().value};
      draw();

      formDiv.transition()
      .duration(1000)
      .style("opacity", 0)
      .remove();
    });


  }

  return ColorScaleChooser;
};


d3.ColorScaleChooser.getA = function(){

};
