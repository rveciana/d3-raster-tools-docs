---
layout: default
title: "Shaded relief"
---

This example shows a simple way to represent a shaded relief.

The color representation is the same as in [this example]({{ site.baseurl }}/code_samples/dem-colors-page.html). The explanation on how to calculate the shaded relief is in the [shaded relief]({{ site.baseurl }}{% post_url 2016-11-29-shaded-relief %}) section.

The DEM data is taken from the SRTM web, and the Swiss contour from [this swiss-maps page](https://github.com/interactivethings/swiss-maps). More information [here]({{ site.baseurl }}/code_samples/swiss-page.html).

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/dem-shaded.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<style>

</style>
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script>
var width = 680,
    height = 500;

var projection = d3.geoAzimuthalEqualArea()
    .rotate([-8.2, -46.8])
    .translate([width/2, height/2])
    .scale(12000);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");
d3.request("swiss.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("swiss.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.country);

  var path = d3.geoPath()
      .projection(projection).context(context);

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];
  var invGeoTransform = [-geoTransform[0]/geoTransform[1], 1/geoTransform[1],0,-geoTransform[3]/geoTransform[5],0,1/geoTransform[5]];

  var altData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      altData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          altData[j][i] = rasters[0][i + j*image.getWidth()];
      }
  }

  //Calculate shaded Relief. Outside the first loop, to be able to put it in a function
  var azimuth = 315;
  var angleAltitude = 45;
  var azimuthrad = azimuth*Math.PI / 180;
  var altituderad = angleAltitude*Math.PI / 180;

  var shadedData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
    shadedData[j] = new Array(image.getWidth());
    for (var i = 0; i<image.getWidth(); i++){
      var gradX, gradY;
      if(i==0) gradX = altData[j][i+1] - altData[j][i];
      else if(i==image.getWidth()-1) gradX = altData[j][i] - altData[j][i-1];
      else gradX = (altData[j][i+1] - altData[j][i])/2 + (altData[j][i] - altData[j][i-1])/2;

      if(j==0) gradY = altData[j+1][i] - altData[j][i];
      else if(j==image.getHeight()-1) gradY = altData[j][i] - altData[j-1][i];
      else gradY = (altData[j+1][i] - altData[j][i])/2 + (altData[j][i] - altData[j-1][i])/2;

      var slope = Math.PI/2 - Math.atan(Math.sqrt(gradX*gradX + gradY*gradY));
      var aspect = Math.atan2(-gradY, gradX);

      shadedData[j][i] = Math.sin(altituderad) * Math.sin(slope)
        + Math.cos(altituderad) * Math.cos(slope)
        * Math.cos(azimuthrad - aspect);
    }
  }

  var canvasShaded = d3.select("body").append("canvas")
      .attr("width", width)
      .attr("height", height)
      .style("display","none");

  var contextShaded = canvasShaded.node().getContext("2d");

  var idShaded = contextShaded.createImageData(width,height);
  var dataShaded = idShaded.data;
  var posShaded = 0;
  for(var j = 0; j<height; j++){
    for(var i = 0; i<width; i++){
      var pointCoords = projection.invert([i,j]);
      var px = invGeoTransform[0] + pointCoords[0]* invGeoTransform[1];
      var py = invGeoTransform[3] + pointCoords[1] * invGeoTransform[5];

      var shadedValue;
      if(Math.floor(px) >= 0 && Math.ceil(px) < image.getWidth() && Math.floor(py) >= 0 && Math.ceil(py) < image.getHeight()){
        shadedValue = 255*(1+shadedData[Math.floor(py)][Math.floor(px)])/2;

      } else {
        shadedValue = 255;
      }
      dataShaded[posShaded]   = shadedValue;
      dataShaded[posShaded+1]   = shadedValue;
      dataShaded[posShaded+2]   = shadedValue;
      dataShaded[posShaded+3]   = 150;

      posShaded=posShaded+4;
    }
  }

  contextShaded.putImageData( idShaded, 0, 0);

  context.drawImage(canvasShaded.node(), 0, 0);
  context.globalAlpha = 0.7;
  context.fillStyle = '#ffffff';
  context.fillRect(0,0,width,height);
  context.fill();
  context.globalAlpha = 1;

  //Creating the color scale https://github.com/santilland/plotty/blob/master/src/plotty.js
  var cs_def = {positions:[0, 0.2, 0.4, 0.6, 0.8, 1], colors:["#c9d5a6", "#7fa67a", "#976a2f", "#79750a", "#7ab5e3", "#fefefe"]};
  var scaleWidth = 256;
  var canvasColorScale = d3.select("body").append("canvas")
      .attr("width", scaleWidth)
      .attr("height", 1)
      ;//.style("display","none");
  var contextColorScale = canvasColorScale.node().getContext("2d");
  var gradient = contextColorScale.createLinearGradient(0, 0, scaleWidth, 1);

  for (var i = 0; i < cs_def.colors.length; ++i) {
    gradient.addColorStop(cs_def.positions[i], cs_def.colors[i]);
  }
  contextColorScale.fillStyle = gradient;
  contextColorScale.fillRect(0, 0, scaleWidth, 1);

  var csImageData = contextColorScale.getImageData(0, 0, scaleWidth, 1).data;

  //Drawing the image

  var canvasRaster = d3.select("body").append("canvas")
      .attr("width", width)
      .attr("height", height)
      .style("display","none");

  var contextRaster = canvasRaster.node().getContext("2d");

  var id = contextRaster.createImageData(width,height);
  var data = id.data;
  var pos = 0;
  for(var j = 0; j<height; j++){
    for(var i = 0; i<width; i++){
      var pointCoords = projection.invert([i,j]);
      var px = invGeoTransform[0] + pointCoords[0]* invGeoTransform[1];
      var py = invGeoTransform[3] + pointCoords[1] * invGeoTransform[5];

      var value;
      if(Math.floor(px) >= 0 && Math.ceil(px) < image.getWidth() && Math.floor(py) >= 0 && Math.ceil(py) < image.getHeight()){
        //https://en.wikipedia.org/wiki/Bilinear_interpolation
        var dist1 = (Math.ceil(px)-px)*(Math.ceil(py)-py);
        var dist2 = (px-Math.floor(px))*(Math.ceil(py)-py);
        var dist3 = (Math.ceil(px)-px)*(py-Math.floor(py));
        var dist4 = (px-Math.floor(px))*(py-Math.floor(py));
        if (dist1 != 0 || dist2!=0 || dist3!=0 || dist4!=0){
          value = altData[Math.floor(py)][Math.floor(px)]*dist1+
          altData[Math.floor(py)][Math.ceil(px)]*dist2 +
          altData[Math.ceil(py)][Math.floor(px)]*dist3 +
          altData[Math.ceil(py)][Math.ceil(px)]*dist4;
        } else {
          value = altData[Math.floor(py)][Math.floor(px)];
        }
      } else {
        value = -999;
      }
        var c = Math.round((scaleWidth-1) * ((value - 200)/3900));
        var alpha = 200;
        if(c<0) c=0;
        if(c>=scaleWidth) c=scaleWidth-1;
        data[pos]   = csImageData[c*4];;
        data[pos+1]   = csImageData[c*4+1];
        data[pos+2]   = csImageData[c*4+2];
        data[pos+3]   = alpha;
        pos = pos + 4

    }
  }
  contextRaster.putImageData( id, 0, 0);
  context.save();
  context.beginPath();
  path(countries);
  context.clip();
  context.drawImage(canvasShaded.node(), 0, 0);
  context.drawImage(canvasRaster.node(), 0, 0);
  context.restore();


  context.beginPath();
  context.strokeStyle = "#777";
  path(countries);
  context.stroke();

});
});
</script>

</body>
{% endhighlight %}
