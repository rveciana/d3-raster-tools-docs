---
layout: default
title: "Drawing an interpolated raster from a projected GeoTIFF"
---
Drawing an interpolated raster from a projected GeoTIFF
-------------------------------------------------------
Projected interpolated raster example from the [projections]({{ site.baseurl }}{% post_url 2016-12-01-projections %}) section.

The example shows how to re-projecta raster point by point.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/raster-interpolation-projected.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<body>
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="proj4.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
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

  var geoTIFFProjection = proj4('PROJCS["unnamed",\
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
        AUTHORITY["EPSG","9001"]]]');  // WGS84 to projection defined in `wkt`

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
  var tiffHeight = image.getHeight();
  var tiffWidth = image.getWidth();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];
  var invGeoTransform = [-geoTransform[0]/geoTransform[1], 1/geoTransform[1],0,-geoTransform[3]/geoTransform[5],0,1/geoTransform[5]];

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


  //Creating the color scale https://github.com/santilland/plotty/blob/master/src/plotty.js
  var cs_def = {positions:[0, 0.25, 0.5, 0.75, 1], colors:["#f7fcfd", "#bfd3e6", "#8f95c6", "#88409b", "#4d004b"]};
  var scaleWidth = 256;
  var canvasColorScale = d3.select("body").append("canvas")
      .attr("width", scaleWidth)
      .attr("height", 1)
      .style("display","none");
  var contextColorScale = canvasColorScale.node().getContext("2d");
  var gradient = contextColorScale.createLinearGradient(0, 0, scaleWidth, 1);

  for (var i = 0; i < cs_def.colors.length; ++i) {
    gradient.addColorStop(cs_def.positions[i], cs_def.colors[i]);
  }
  contextColorScale.fillStyle = gradient;
  contextColorScale.fillRect(0, 0, scaleWidth, 1);

  var csImageData = contextColorScale.getImageData(0, 0, scaleWidth-1, 1).data;

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
      var coords = projection.invert([i,j]);
      coords = geoTIFFProjection.forward(coords);

      var px = (coords[0] - geoTransform[0]) / geoTransform[1];
      var py = (coords[1] - geoTransform[3]) / geoTransform[5];
      var value;
      if(Math.floor(px) >= 0 && Math.ceil(px) < tiffWidth && Math.floor(py) >= 0 && Math.ceil(py) < tiffHeight){
        var dist1 = (Math.ceil(px)-px)*(Math.ceil(py)-py);
        var dist2 = (px-Math.floor(px))*(Math.ceil(py)-py);
        var dist3 = (Math.ceil(px)-px)*(py-Math.floor(py));
        var dist4 = (px-Math.floor(px))*(py-Math.floor(py));
        if (dist1 != 0 || dist2!=0 || dist3!=0 || dist4!=0){
          value = spdData[Math.floor(py)][Math.floor(px)]* dist1 +
          spdData[Math.floor(py)][Math.ceil(px)]* dist2 +
          spdData[Math.ceil(py)][Math.floor(px)]* dist3 +
          spdData[Math.ceil(py)][Math.ceil(px)]* dist4;
        } else {
          value = spdData[Math.floor(py)][Math.floor(px)];
        }
      } else {
        value = -999;
      }

      var c = Math.round((scaleWidth-1) * (value/40));
      var alpha = 200;
      if (c<0 || c > (scaleWidth-1)){
        alpha = 0;
      }
      data[pos]   = csImageData[c*4];;
      data[pos+1]   = csImageData[c*4+1];
      data[pos+2]   = csImageData[c*4+2];
      data[pos+3]   = alpha;
      pos = pos + 4

    }
  }

  contextRaster.putImageData( id, 0, 0);
  context.drawImage(canvasRaster.node(), 0, 0);

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
