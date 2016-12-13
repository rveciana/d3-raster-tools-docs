---
layout: default
title: "Drawing streamlines"
---
Drawing streamlines
-------------------
Example from the [drawing streamlines]({{ site.baseurl }}{% post_url 2016-12-13-streamlines %}) section.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/streamlines.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="raster-streamlines.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script>
var width = 680,
    height = 500,
    barbSize = 30;

var projection = d3.geoConicConformal()
    .rotate([-34, -8])
    .center([0, 34.83158])
    .scale(4000)
    .translate([width / 2, height / 2]);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");
d3.request("gfs.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);
  var path = d3.geoPath()
      .projection(projection).context(context);

  context.beginPath();
  context.strokeStyle = "#000";
  context.fillStyle = "#aaa";
  path(countries);
  context.fill();

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];

  var uData = new Array(image.getHeight());
  var vData = new Array(image.getHeight());
  var spdData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      uData[j] = new Array(image.getWidth());
      vData[j] = new Array(image.getWidth());
      spdData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          uData[j][i] = rasters[0][i + j*image.getWidth()];
          vData[j][i] = rasters[1][i + j*image.getWidth()];
          spdData[j][i] = 1.943844492 * Math.sqrt(uData[j][i]*uData[j][i] + vData[j][i]*vData[j][i]);
      }
  }

  var lines = rastertools.streamlines(uData,vData, geoTransform);
  lines.features.forEach(function(d) {
    context.beginPath();
    context.strokeStyle = "#000000";
    path(d);
    context.stroke();

  });


});
});
</script>

</body>
{% endhighlight %}
