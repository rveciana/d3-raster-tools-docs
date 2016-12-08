---
layout: page
title: "Reading raster data"
category: intr
date: 2016-12-07 18:04:19
disqus: 1
---

All this documentation is about representing raster data. In GIS, a [raster](https://en.wikipedia.org/wiki/Raster_graphics#Geographic_information_systems) is basically a 2-dimension matrix with the value of a magnitude in each point. The position over the Globe for each pixel (or matrix position) is given by the [GeoTransform]({{ site.baseurl }}{% post_url 2016-12-07-geotransform %}), and those positions are in a specific [projection]({{ site.baseurl }}{% post_url 2016-12-01-projections %}).

There are different ways to use a 2D matrix in JavaScript, and here I'll be using the easiest one, an array of arrays. So, if the data is in a 1D array, can be transformed by:

{% highlight js %}
var tempData = new Array(geotiffHeight);
  for (var j = 0; j<geotiffHeight; j++){
      tempData[j] = new Array(geotiffWidth);
      for (var i = 0; i<geotiffWidth; i++){
          tempData[j][i] = rasterArray[i + j*geotiffWidth];
      }
  }
{% endhighlight %}

GeoTIFF
-------

There are many [GIS raster formats](http://www.gdal.org/formats_list.html), but reading them in JavaScript is quite difficult. There is no library like [GDAL](http://www.gdal.org/) that works in pure JavaScript. Working with Nodejs you can try [GDAL for Nodejs](https://www.npmjs.com/package/gdal), but the tutorial tries to show how to draw with the broswer too.

Fortunately, the most used format, [GeoTIFF](https://trac.osgeo.org/geotiff/), can be read using the [geotiff.js](https://github.com/constantinius/geotiff.js) library. Some options are still not implemented, but most of the files can be read perfectly, which is a great advance. To read the GeoTIFF file and create a matrix:

{% highlight js %}
d3.request("tz850.tiff")
.responseType('arraybuffer')
.get(function(error, tiffData){
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
});
{% endhighlight %}
[See the complete working example here]({{ site.baseurl }}/code_samples/geotiff.html)

* Note that the GeoTIFF file data must be read as an [arraybuffer](https://developer.mozilla.org/ca/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
  * If you don't want to use d3js, try [this option](https://github.com/constantinius/geotiff.js#usage)
* The example file has two layers (or bands). In the example, we want the second one, that represents temperature, so *rasters[1]* is the actual array to be processed
* The example shows how to calculate the [GeoTransform]({{ site.baseurl }}{% post_url 2016-12-07-geotransform %}) and the inverse geotransform (how to calculate the pixel from the geographic coordinates)

If used from nodejs, the form to read the file is slightly different, since the *fs* functions are used:

{% highlight js %}
var fs = require("fs");
var geotiff = require("geotiff");

var parser = geotiff.parse(dataArray);
var image = parser.getImage();
var rasters = image.readRasters();
{% endhighlight %}

The other parts of the code are the same.
