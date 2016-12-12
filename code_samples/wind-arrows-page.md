---
layout: default
title: "Drawing wind barbs"
---
Drawing wind barbs
--------------------------
Canvas example from the [arrows and barbs]({{ site.baseurl }}{% post_url 2016-12-11-arrows-and-barbs %}) section. The data and the code are based on this [wind barbs example]({{ site.baseurl }}/code_samples/wind-barbs-page.html).

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-arrows.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script>
var width = 680,
    height = 500,
    arrowSize = 30;

var projection = d3.geoConicConformal()
    .rotate([-33, -5])
    .center([0, 34.83158])
    .scale(2000)
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
  var maxSpd = 0;
  for (var j = 0; j<image.getHeight(); j++){
      uData[j] = new Array(image.getWidth());
      vData[j] = new Array(image.getWidth());
      spdData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          uData[j][i] = rasters[0][i + j*image.getWidth()];
          vData[j][i] = rasters[1][i + j*image.getWidth()];
          spdData[j][i] = 1.943844492 * Math.sqrt(uData[j][i]*uData[j][i] + vData[j][i]*vData[j][i]);
          if (spdData[j][i]>maxSpd){
            maxSpd = spdData[j][i];
          }
      }
  }

  var colorScale = d3.scaleSequential(d3.interpolateBuPu)
      .domain([0, maxSpd]);
  var sizeScale = d3.scaleLinear()
      .domain([0, maxSpd])
      .range([0.5, 1.3]);

  var xPos = d3.range(arrowSize, width, arrowSize);
  var yPos = d3.range(arrowSize, height, arrowSize);

  xPos.forEach(function(x){
    yPos.forEach(function(y){
      var coords = projection.invert([x,y]);
      var px = Math.round((coords[0] - geoTransform[0]) / geoTransform[1]);
      var py = Math.round((coords[1] - geoTransform[3]) / geoTransform[5]);

      var angle = Math.atan2(-vData[py][px],uData[py][px]);
      var spd = spdData[py][px];
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.scale(sizeScale(spd), sizeScale(spd));
      context.beginPath();
      context.strokeStyle = "#444";
      context.fillStyle = colorScale(spd);

      context.moveTo(-arrowSize/2,0);
      context.lineTo(arrowSize/5,arrowSize/6);
      context.lineTo(arrowSize/5,arrowSize/3);
      context.lineTo(arrowSize/2,0);
      context.lineTo(arrowSize/5,-arrowSize/3);
      context.lineTo(arrowSize/5,-arrowSize/6);
      context.lineTo(-arrowSize/2,0);

      context.stroke();
      context.fill();
      context.restore();
    });
  });


});
});
</script>

</body>
{% endhighlight %}
