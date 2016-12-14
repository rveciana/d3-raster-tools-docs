---
layout: default
title: "Drawing  with labels"
---
Drawing isolines with labels
----------------------------
SVG example from the [drawing isolines]({{ site.baseurl }}{% post_url 2016-12-13-isolines %}) section.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/isolines-labels-svg.html"></iframe>

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

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

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

  var intervalsZ = [1400, 1420, 1440, 1460, 1480, 1500, 1520, 1540];
  var linesZ = rastertools.isolines(zData, geoTransform, intervalsZ);
  var colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([1400, 1540]);

  var maskZones = svg.append("defs")
    .append("mask")
    .attr("id", "labelsMask")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width",width)
    .attr("height", height);

  maskZones.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width",width)
    .attr("height", height)
    .attr("fill", "white");

  linesZ.features.forEach(function(d, i) {
    var separation = 150;
    var properties = spp.svgPathProperties(path(d));
    var text = d.properties[0].value;
    var textEl = svg.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-family", "Georgia")
      .attr("font-size","15px")
      .text(text)
      .style("visibility", "hidden");

    var bbox = textEl.node().getBBox();

    svg.insert("path", ".streamline")
        .datum(d)
        .attr("d", path)
        .attr("mask","url(#labelsMask)")
        .style("stroke", colorScale(intervalsZ[i]))
        .style("stroke-width", "2px")
        .style("fill", "None");

    for(var j = 0; j< Math.floor(properties.getTotalLength()/separation); j++){
      var pos = properties.getPropertiesAtLength(75 + separation*j);
      var degrees = (180/Math.PI)*Math.atan(pos.tangentY/pos.tangentX);

      svg.append("text")
        .attr("x", -bbox.width/2)
        .attr("y", 7.5)
        .attr("font-family", "Georgia")
        .attr("font-size","15px")
        .attr("transform", "translate("+pos.x+", "+pos.y+")rotate("+degrees+")")
        .text(text);

      maskZones.append("rect")
      .attr("x", -2-bbox.width/2)
      .attr("y", -8)
      .attr("width", bbox.width+4)
      .attr("height", bbox.height)
      .attr("fill", "black")
      .attr("transform", "translate("+pos.x+", "+pos.y+")rotate("+degrees+")");

      }
});

  svg.insert("path", ".map")
      .datum(countries)
      .attr("d", path)
      .style("opacity", "0.4")
      .style("fill", "#ccc")
      .style("stroke", "#777")
      .style("stroke-width", "1.5px");

});
});
</script>

</body>
{% endhighlight %}
