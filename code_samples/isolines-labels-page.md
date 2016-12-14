---
layout: default
title: "Drawing  with labels"
---
Drawing isolines with labels
----------------------------
Canvas example from the [drawing isolines]({{ site.baseurl }}{% post_url 2016-12-13-isolines %}) section.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/isolines-labels.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<style>

</style>
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="raster-marching-squares.min.js"></script>
<script src="path-properties.min.js"></script>
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

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];

  var zData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      zData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          zData[j][i] = rasters[0][i + j*image.getWidth()];
      }
  }

  var path = d3.geoPath()
      .projection(projection).context(context);

  context.beginPath();
  context.strokeStyle = "#000";
  context.fillStyle = "#aaa";
  context.lineWidth = 1.5;
  context.globalAlpha = 0.5;
  path(countries);
  context.stroke();
  context.fill();

  //Creating the isolines in a separate hidden canvas
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

  var intervalsZ = [1400, 1420, 1440, 1460, 1480, 1500, 1520, 1540];
  var linesZ = rastertools.isolines(zData, geoTransform, intervalsZ);
  var colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([1400, 1540]);
  linesZ.features.forEach(function(d, i) {
      hiddenContext.beginPath();
      hiddenContext.globalAlpha = 1;
      hiddenContext.lineWidth = 2;
      hiddenContext.strokeStyle = colorScale(intervalsZ[i]);
      hiddenPath(d);
      hiddenContext.stroke();
      //Drawing labels
      var properties = spp.svgPathProperties(hiddenPath2(d));
      var separation = 150;

      for(var j = 0; j< Math.floor(properties.getTotalLength()/separation); j++){
        var pos = properties.getPropertiesAtLength(75 + separation*j);

        var degrees = Math.atan(pos.tangentY/pos.tangentX);
        var text = d.properties[0].value;
        hiddenContext.save();

        hiddenContext.translate(pos.x, pos.y);
        hiddenContext.rotate(degrees);

        hiddenContext.font="15px Georgia";

        hiddenContext.clearRect(-2-hiddenContext.measureText(text).width/2 , -8, 4 + hiddenContext.measureText(text).width, 19);
        hiddenContext.fillStyle = "#500";
    		hiddenContext.fillText(text, -hiddenContext.measureText(text).width/2, 7.5);
        hiddenContext.restore();
      }
  });

  //Merging the hidden canvas
  context.drawImage(hiddenCanvas.node(), 0, 0, width, height);

});
});
</script>

</body>

{% endhighlight %}
