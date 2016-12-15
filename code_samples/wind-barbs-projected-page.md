---
layout: default
title: "Drawing wind barbs from a projected GeoTIFF"
---
Drawing wind barbs from a projected GeoTIFF
-------------------------------------------
Projected wind barbs example from the [projections]({{ site.baseurl }}{% post_url 2016-12-01-projections %}) section.

The example shows how to re-project points and paths, which require different techniques.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-barbs-projected.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<body>
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="reproject.js"></script>
<script src="proj4.js"></script>
<script src="raster-marching-squares.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script>
var width = 680,
    height = 500,
    barbSize = 40;

var projection = d3.geoConicConformal()
    .rotate([82, 0])
    .center([0, 34.83158])
    .parallels([30, 60])
    .scale(2300)
    .translate([width / 2, height / 2]);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");
d3.request("wrf.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);
  var path = d3.geoPath()
      .projection(projection).context(context);

  context.beginPath();
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

  var intervalsSpd = [0, 5, 10, 15, 20, 25, 30, 35, 40];
  var bandsSpd = rastertools.isobands(spdData, geoTransform, intervalsSpd);
  var firstProjection='PROJCS["unnamed",\
    GEOGCS["unnamed ellipse",\
        DATUM["unknown",\
            SPHEROID["unnamed",6370997,0]],\
        PRIMEM["Greenwich",0],\
        UNIT["degree",0.0174532925199433]],\
    PROJECTION["Lambert_Conformal_Conic_2SP"],\
    PARAMETER["standard_parallel_1",30],\
    PARAMETER["standard_parallel_2",60],\
    PARAMETER["latitude_of_origin",34.83158],\
    PARAMETER["central_meridian",-98],\
    PARAMETER["false_easting",0],\
    PARAMETER["false_northing",0],\
    UNIT["metre",1,\
        AUTHORITY["EPSG","9001"]]]';

  bandsSpd = reproject.toWgs84(bandsSpd, firstProjection);
  var colorScale = d3.scaleSequential(d3.interpolateBuPu);
  bandsSpd.features.forEach(function(d, i) {
      context.beginPath();
      context.globalAlpha = 0.7;
      context.fillStyle = colorScale(intervalsSpd[i]/40);
      path(d);
      context.fill();
  });

  var xPos = d3.range(barbSize, width, barbSize);
  var yPos = d3.range(barbSize, height, barbSize);


  xPos.forEach(function(x){
    yPos.forEach(function(y){
      var coords = projection.invert([x,y]);
      coords = proj4(firstProjection).forward(coords);
      var px = Math.round((coords[0] - geoTransform[0]) / geoTransform[1]);
      var py = Math.round((coords[1] - geoTransform[3]) / geoTransform[5]);
      var angle = Math.atan2(-vData[py][px],uData[py][px]);
      var spd5 = Math.round(spdData[py][px]/5);
      var spd10 = Math.floor(spd5/2);
      spd5 = spd5%2;
      var spd50 = Math.floor(spd10/5);
      spd10 = spd10%5;
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.beginPath();
      context.strokeStyle = "#444";
      context.fillStyle = "#444";

      var pos = -barbSize/2;
      var separation = 3;

      for(var i=0; i<spd50; i++){
        context.moveTo(pos, 0);
        context.lineTo(pos+barbSize/8, barbSize/4);
        context.lineTo(pos+barbSize/4, 0);
        pos = pos + barbSize/4 + separation;
        context.fill();
      }
      for(var i=0; i<spd10; i++){
        context.moveTo(pos, 0);
        context.lineTo(pos, barbSize/3);
        pos = pos + separation
      }
      if(spd5==1){
        if (pos == -barbSize/2){
          pos = pos + separation
        }
        context.moveTo(pos, 0);
        context.lineTo(pos, barbSize/6);
      }
      if(spd5==0 && spd10== 0 && spd50==0){
        context.arc(0, 0, 4, 0, 2 * Math.PI, false);
      } else {
        context.moveTo(-barbSize/2,0);
        context.lineTo(barbSize/2,0);
      }
      context.stroke();
      context.restore();
    });
  });

  context.beginPath();
  context.lineWidth = 1.5;
  context.strokeStyle = "#777";
  path(countries);
  context.stroke();

});
});
</script>

</body>
{% endhighlight %}
