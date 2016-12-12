---
layout: default
title: "Drawing wind barbs"
---
Drawing wind barbs
--------------------------
Canvas example from the [arrows and barbs]({{ site.baseurl }}{% post_url 2016-12-11-arrows-and-barbs %}) section.

The data is taken from the GFS model, following these steps:

* Download at a link like this one (dates may not be available):  http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.2016112400/
* Running *gdalinfo gfs.t00z.sfluxgrbf00.grib2*, see that the bands 50 and 51 are UGRD and VGRD at 10-HTGL (surface wind)
* Run *gdal_translate -b 50 -b 51 -projwin 17 50 47 29 gfs.t00z.sfluxgrbf00.grib2 /tmp/gfs.tiff*
  * Note that the [geotiff-js](https://github.com/constantinius/geotiff.js) library has some problems with compression
* This image, taken from [weatheronline](http://www.weatheronline.co.uk), shows that the barbs are coherent with other source images

<img src="{{ site.baseurl }}/images/vectors-barbs/16112400_2400.gif" />

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-barbs.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script>
var width = 680,
    height = 500,
    barbSize = 30;

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

  var xPos = d3.range(barbSize, width, barbSize);
  var yPos = d3.range(barbSize, height, barbSize);

  xPos.forEach(function(x){
    yPos.forEach(function(y){
      var coords = projection.invert([x,y]);
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
      var separation = 2.5;

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


});
});
</script>

</body>

{% endhighlight %}
