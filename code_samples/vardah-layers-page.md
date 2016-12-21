---
layout: default
title: "Choosing layers and showing scales"
---
Choosing layers and showing scales
----------------------------------
Example showing the way to change the visible data layers.

If you click on the image, the values for the pixel will be shown as explained in the [tooltips]({{ site.baseurl }}{% post_url 2016-12-01-tooltips %}) section.

The color scales are drawn using the [d3-legend](http://d3-legend.susielu.com/) library by Susie Lu.

The color scales are inspirated by the maps at [weatherbell.com](www.weatherbell.com).

The data is from the GFS model for the Vardah cyclone. [See how the data was generated]({{ site.baseurl }}/code_samples/vardah.html).

<iframe frameborder="no" border="0" scrolling="yes" marginwidth="0" marginheight="0" width="1050" height="510" src="{{ site.baseurl }}/code_samples/vardah-layers.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<style>
#tooltip {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  margin: 0;
  padding: 10px;
  width: 180px;
  height: 70px;
  color: white;
  font-family: sans-serif;
  font-size: 0.9em;
  font-weight: bold;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.55);
  opacity: 0;
  pointer-events: none;
  border-radius:5px;
  transition: .2s;
}
</style>
<body>
<div id="map" style="position: relative;"> </div>
<div id="tooltip">
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script src="raster-marching-squares.min.js"></script>
<script src="path-properties.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.19.0/d3-legend.min.js"></script>

<script>

var width = 680,
    height = 500,
    arrowSize = 30;

var projection = d3.geoMercator()
    .rotate([-81, -13])
    .scale(2000)
    .translate([width / 2, height / 2]);

var canvas = d3.select("#map").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");
d3.request("vardah.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);
  var path = d3.geoPath()
      .projection(projection).context(context);

  var path2 = d3.geoPath()
      .projection(projection);

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var tiffWidth = image.getWidth();
  var tiffHeight = image.getHeight();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];

  var pressData = new Array(tiffHeight);
  var tempData = new Array(tiffHeight);
  var uData = new Array(tiffHeight);
  var vData = new Array(tiffHeight);
  var spdData = new Array(tiffHeight);
  for (var j = 0; j<tiffHeight; j++){
      pressData[j] = new Array(tiffWidth);
      tempData[j] = new Array(tiffWidth);
      uData[j] = new Array(tiffWidth);
      vData[j] = new Array(tiffWidth);
      spdData[j] = new Array(tiffWidth);
      for (var i = 0; i<tiffWidth; i++){
          pressData[j][i] = rasters[0][i + j*tiffWidth];
          tempData[j][i] = rasters[1][i + j*tiffWidth];
          uData[j][i] = rasters[2][i + j*tiffWidth];
          vData[j][i] = rasters[3][i + j*tiffWidth];
          spdData[j][i] = 1.943844492 * Math.sqrt(uData[j][i]*uData[j][i] + vData[j][i]*vData[j][i]);

      }
  }

  var windScale = d3.scaleThreshold()
  .domain([8, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42,
    44, 46, 48, 50, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96 ])
  .range(["#ffffff", "#e5e5e6" , "#d1d1d1", "#bababa", "#979797", "#646464",
          "#1464d3", "#1e6eeb", "#2883f1", "#3c97f5", "#50a5f5", "#78b9fb", "#97d3fb", "#b5f1fb", "#e1ffff",
          "#0ea10e", "#1eb31e", "#36d33c", "#50ef50", "#78f572", "#97f58d", "#b5fbab", "#c9ffbf",
          "#ffe978", "#ffc13c", "#ffa100", "#ff6000", "#ff3200", "#e11400", "#c10000", "#a50000",
          "#643c32", "#785046", "#8d645a"]);

  var intervalsSpd = [0, 8, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42,
    44, 46, 48, 50, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96 ];
  var bandsWind = rastertools.isobands(spdData, geoTransform, intervalsSpd);

  var tempScale = d3.scaleThreshold()
    .domain([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 39, 32, 34, 36, 38, 40 ])
    .range(["#381e99", "#5d1e6e" , "#7c1e4b", "#af3738", "#c86969", "#e9b3b3",
            "#f6e8e8", "#c7efef", "#79bee1", "#5d8bbe", "#545491", "#9e9eb1", "#fffe77", "#faa108", "#f96400",
            "#bc3824", "#6a171f", "#5f3a23", "#6e5a56", "#b29c7f", "#b29c8f", "#b29c9f"]);
  var intervalsTemp = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 39, 32, 34, 36, 38, 40];
  var bandsTemp = rastertools.isobands(tempData, geoTransform, intervalsTemp);

  var intervalsPress = [970, 972, 974, 976, 978, 980, 982, 984, 986, 988, 990, 992, 994, 996, 998,
    1000, 1002, 1004, 1006, 1008, 1010, 1012, 1014, 1016, 1018, 1020, 1022, 1024, 1026, 1028];
  var isobars = rastertools.isolines(pressData, geoTransform, intervalsPress);

  function drawMap(){
        var variable = d3.select('input[name="wort"]:checked').node().value;


        var bands, scale, title;
        if(variable=="wind"){
          bands = bandsWind;
          scale = windScale;
          title = "Wind Speed (kt)";
        } else {
          bands = bandsTemp;
          scale = tempScale;
          title = "Temperature (C)";
        }

        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.strokeStyle = "#000";
        context.fillStyle = "#aaa";
        path(countries);
        context.fill();
        context.stroke();

        bands.features.forEach(function(d, i) {
          context.beginPath();
          context.globalAlpha = 0.8;
          context.fillStyle = scale((d.properties[0].lowerValue + d.properties[0].upperValue)/2);
          path(d);
          context.fill();
        });


      var pressure = d3.select('input[name="press"]').node().checked;

      if(pressure){
        var hiddenCanvas = d3.select("body").append("canvas")
              .attr("width", width)
              .attr("height", height)
              .attr("id", "hiddenCanvas")
              .style("display","none");
        var hiddenContext = hiddenCanvas.node().getContext("2d");

        var hiddenPath = d3.geoPath()
            .projection(projection).context(hiddenContext);
        var hiddenPath2 = d3.geoPath()
            .projection(projection);


        isobars.features.forEach(function(d, i) {
          hiddenContext.beginPath();
          hiddenContext.strokeStyle = "#555";
          hiddenPath(d);
          hiddenContext.stroke();

          var properties = spp.svgPathProperties(hiddenPath2(d));
          var separation = 300;

          if(properties){
            for(var j = 0; j< Math.floor(properties.getTotalLength()/separation); j++){
              var pos = properties.getPropertiesAtLength(75 + separation*j);

              var degrees = Math.atan(pos.tangentY/pos.tangentX);
              var text = d.properties[0].value;
              hiddenContext.save();

              hiddenContext.translate(pos.x, pos.y);
              hiddenContext.rotate(degrees);

              hiddenContext.font="12px Georgia";

              hiddenContext.clearRect(-2-hiddenContext.measureText(text).width/2 , -8, 4 + hiddenContext.measureText(text).width, 19);
              hiddenContext.fillStyle = "#500";
              hiddenContext.fillText(text, -hiddenContext.measureText(text).width/2, 7.5);
              hiddenContext.restore();
            }
          }
        });

        context.drawImage(hiddenCanvas.node(), 0, 0, width, height);
      }

      d3.select("svg").remove();
      var svg = d3.select("#map").append("svg")
        .attr("height", "500")
        .attr("id", "legend")
        .style("font-size", "11px");

      var group = svg.append("g")
        .attr("class", "legendThreshold")
        .attr("transform", "translate(20,20)");

      var legend = d3.legendColor()
          .labelFormat(d3.format("d"))
          .labels(d3.legendHelpers.thresholdLabels)
          .useClass(false)
          .shapeHeight(11)
          .title(title)
          .scale(scale)

      group
        .call(legend);
    }

    var layerSelect = d3.select("#map").append("div")
    .style("position", "absolute")
    .style("left", "10px")
    .style("top", "10px")
    .style("border-radius", "10px")
    .style("background", "#73AD2166")
    .style("padding", "10px");



    layerSelect.append("input")
      .attr("type", "radio")
      .attr("name", "wort")
      .attr("value", "wind")
      .attr("checked", "checked")
      .on("click", function(d){drawMap();});
   layerSelect.append("text").text("wind");

   layerSelect.append("input")
     .attr("type", "radio")
     .attr("name", "wort")
     .attr("value", "temp")
     .on("click", function(d){drawMap();});
  layerSelect.append("text").text("temp");


  layerSelect.append("input")
    .attr("type", "checkbox")
    .attr("name", "press")
    .attr("value", "press")
    .on("click", function(d){drawMap();});
 layerSelect.append("text").text("press");

 canvas.on("click", function() {

    var screenCoords = d3.mouse(this);
    var coords = projection.invert(screenCoords);
    var xTiff = (coords[0] - geoTransform[0])/geoTransform[1];
    var yTiff = (coords[1] - geoTransform[3])/geoTransform[5];
    var temp = tempData[Math.round(yTiff)][Math.round(xTiff)];
    var press = pressData[Math.round(yTiff)][Math.round(xTiff)];
    var uValue = uData[Math.round(yTiff)][Math.round(xTiff)];
    var vValue = vData[Math.round(yTiff)][Math.round(xTiff)];
    var spd = Math.sqrt(uValue*uValue + vValue*vValue);
    var dir = 270 + (Math.atan2(-vValue,uValue)*180/Math.PI);
    if(dir<0){dir = dir + 360;}
    if(dir>360){dir = dir - 360;}

    d3.select("#tooltip")
        .style("left", screenCoords[0] + "px")
        .style("top", screenCoords[1] + "px")
        .style("opacity", 1)
        .html("Wind speed: " + spd.toFixed(1) + " m/s <br/>Wind dir: " + dir.toFixed(0) +"º <br/>Temp: " + temp.toFixed(1) + " C<br/>Pressure: " + press.toFixed(0) + " hPa");

  });

  drawMap();



});
});


</script>

</body>
{% endhighlight %}
