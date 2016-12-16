---
layout: page
title: "Drawing raster data"
category: plot
date: 2016-12-07 17:17:40
disqus: 1
---

When [reading a raster]({{ site.baseurl }}{% post_url 2016-12-31-reading-raster-data %}), the result is a matrix with the value for each pixel. With this data, the simplest thing to do is drawing the value of each pixel.

To draw them, only the *canvas* option is available for performance reasons, since the amount of pixels is usually very high.

Drawing the GeoTIFF pixels
--------------------------
Let's see the most important code parts to get this example:

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/raster-pixels.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/raster-pixels-page.html)
{% highlight js %}
var projection = d3.geoAzimuthalEqualArea()
    .rotate([-55.5, -24])
    .scale(1100);
{% endhighlight %}
* The projection is set to *geoAzimuthalEqualArea*, but the nice thing about D3js is that this could be changed and the result would change accordingly
{% highlight js %}
d3.request("tz850.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
{% endhighlight %}
* Note that, as explained in the [reading a raster]({{ site.baseurl }}{% post_url 2016-12-31-reading-raster-data %}) page, the request is a bit different for the GeoTIFF
{% highlight js %}
  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];
  var invGeoTransform = [-geoTransform[0]/geoTransform[1], 1/geoTransform[1],0,-geoTransform[3]/geoTransform[5],0,1/geoTransform[5]];

  var tempData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      tempData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          tempData[j][i] = rasters[1][i + j*image.getWidth()];
      }
  }
{% endhighlight %}
* The GeoTIFF is read as explained in the [reading a raster]({{ site.baseurl }}{% post_url 2016-12-31-reading-raster-data %}) page

{% highlight js %}
  var cs_def = {positions:[0, 0.25, 0.5, 0.75, 1], colors:["#0571b0", "#92c5de", "#f7f7f7", "#f4a582", "#ca0020"]};
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
{% endhighlight %}
* The color scale is created as explained in the [color scales]({{ site.baseurl }}{% post_url 2016-12-09-color-scales %}) page

This is the actual drawing part:
{% highlight js %}
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
      var px = Math.round(invGeoTransform[0] + pointCoords[0]* invGeoTransform[1]);
      var py = Math.round(invGeoTransform[3] + pointCoords[1] * invGeoTransform[5]);

      if(Math.floor(px) >= 0 && Math.ceil(px) < image.getWidth() && Math.floor(py) >= 0 && Math.ceil(py) < image.getHeight()){
        var value = tempData[py][px];

        var c = Math.round((scaleWidth-1) * ((value - 14)/24));
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
  }
  contextRaster.putImageData( id, 0, 0);
  context.drawImage(canvasRaster.node(), 0, 0);
{% endhighlight %}
* A separate canvas is created, so any pixel drawing won't affect the background
  * *var data* has the pixel values of this new created canvas. The array has four elements for each pixel to represent the RGBA values. It's the fastest way to draw an image, much more than drawing small rectangles
* The iteration is for each pixel in the output canvas, not the original GeoTIFF matrix
  * To get the position in the values matrix, the output projection must be transformed to lat-lon using *projection.invert*
  * Since the GeiTIFF is already in latlon, apply the [inverse GeoTransform]({{ site.baseurl }}{% post_url 2016-12-30-geotransform %}) to get the position in the values matrix
  * We want to represent the original pixels, in this example, so the pixel position is rounded to get the nearest pixel in the values matrix
* The color to use is calculated with the method explained in the [color scales]({{ site.baseurl }}{% post_url 2016-12-09-color-scales %}) page

Interpolating the GeoTIFF pixels to get a smooth image
------------------------------------------------------
This example is very similar to the previous one, but the value for each pixel is calculated interpolating the surrounding values with a [bilinear interpolation](http://strauss.pas.nu/js-bilinear-interpolation.html).

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/raster-interpolation.html"></iframe>

The [whole code is here]({{ site.baseurl }}/code_samples/raster-interpolation-page.html). The only changes are:
{% highlight js %}
var px = invGeoTransform[0] + pointCoords[0]* invGeoTransform[1];
var py = invGeoTransform[3] + pointCoords[1] * invGeoTransform[5];
{% endhighlight %}
* The pixel positions are not rounded, we need to know the decimal part of it to interpolate
{% highlight js %}
var dist1 = (Math.ceil(px)-px)*(Math.ceil(py)-py);
var dist2 = (px-Math.floor(px))*(Math.ceil(py)-py);
var dist3 = (Math.ceil(px)-px)*(py-Math.floor(py));
var dist4 = (px-Math.floor(px))*(py-Math.floor(py));
if (dist1 != 0 || dist2!=0 || dist3!=0 || dist4!=0){
  value = tempData[Math.floor(py)][Math.floor(px)]*dist1+
  tempData[Math.floor(py)][Math.ceil(px)]*dist2 +
  tempData[Math.ceil(py)][Math.floor(px)]*dist3 +
  tempData[Math.ceil(py)][Math.ceil(px)]*dist4;
} else {
  value = spdData[Math.floor(py)][Math.floor(px)];
}
{% endhighlight %}
* A [bilinear interpolation](https://en.wikipedia.org/wiki/Bilinear_interpolation) is used to get the value. The inverse of distance gives uglier results, with visible pixels
* If px, py is exactly the datapixel position, all weights would be 0, so we have to check this case to put the pixel value
  * In this example, it's not necessary, but the code wouldn't be correct if this case istn't handled
