---
layout: default
title: "Drawing isobands"
---
Drawing isobands
----------------
Canvas example from the [tooltips]({{ site.baseurl }}{% post_url 2016-12-01-tooltips %}) section. Click on any part of the image to see the GeoTIFF value on a tooltip

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/isobands-tooltip.html"></iframe>

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
  height: 40px;
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
<div id="tooltip">
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="raster-marching-squares.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>

<script>
var width = 680,
    height = 500;
var projection = d3.geoAzimuthalEqualArea()
    .rotate([-55.5, -24])
    .scale(1100);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");
d3.request("tz850.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);
  var path = d3.geoPath()
      .projection(projection).context(context);

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];

  var tempData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      tempData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          tempData[j][i] = rasters[1][i + j*image.getWidth()];
      }
  }

  context.beginPath();
  context.fillStyle = "#aaa";
  path(countries);
  context.fill();

  var intervalsTemp = [14,17,20,23,26,29, 32, 35, 38];
  var bandsTemp = rastertools.isobands(tempData, geoTransform, intervalsTemp);
  var colorScale = d3.scaleSequential(d3.interpolateRdBu)
      .domain([38, 14]);
  bandsTemp.features.forEach(function(d, i) {
      context.beginPath();
      context.globalAlpha = 0.8;
      context.fillStyle = colorScale(intervalsTemp[i]);
      path(d);
      context.fill();
  });

  context.beginPath();
    context.strokeStyle = "#000";
    context.lineWidth = 1.5;
    context.globalAlpha = 0.5;
    path(countries);
    context.stroke();

  canvas.on("click", function() {
    var screenCoords = d3.mouse(this);
    var coords = projection.invert(screenCoords);
    var xTiff = (coords[0] - geoTransform[0])/geoTransform[1];
    var yTiff = (coords[1] - geoTransform[3])/geoTransform[5];
    var tempValue = tempData[Math.round(yTiff)][Math.round(xTiff)];

    d3.select("#tooltip")
        .style("left", screenCoords[0] + "px")
        .style("top", screenCoords[1] + "px")
        .style("opacity", 1)
        .html("850 hPa temp: " + tempValue.toFixed(1) + " C");

  });
});
});
</script>

</body>
{% endhighlight %}
