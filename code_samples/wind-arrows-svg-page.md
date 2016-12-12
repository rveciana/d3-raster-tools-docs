---
layout: default
title: "Drawing wind arrows"
---
Drawing wind arrows
--------------------------
SVG example from the [arrows and barbs]({{ site.baseurl }}{% post_url 2016-12-11-arrows-and-barbs %}) section. The data and the code are based on this [wind barbs example]({{ site.baseurl }}/code_samples/wind-barbs-svg-page.html).

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-arrows-svg.html"></iframe>

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

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.request("gfs.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {

  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);
  svg.insert("path", ".map")
      .datum(countries)
      .attr("d", path)
      .style("fill", "#ccc")
      .style("stroke", "#777");

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

      var angle = (180/Math.PI) * Math.atan2(-vData[py][px],uData[py][px]);
      var spd = spdData[py][px];
      svg.append("path")
        .attr("d", "M"+-arrowSize/2+",0L"+arrowSize/5+","+arrowSize/6+"L"+arrowSize/5+","+arrowSize/3+"L"+arrowSize/2+",0L"+arrowSize/5+","+(-arrowSize/3)+"L"+arrowSize/5+","+(-arrowSize/6)+"Z")
        .style("fill", colorScale(spd))
        .style("stroke", "#444")
        .attr("transform", "translate("+x+", "+y+")rotate("+angle+")scale("+sizeScale(spd)+")");;
    });
  });


});
});
</script>
</body>
{% endhighlight %}
