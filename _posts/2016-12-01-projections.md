---
layout: page
title: "Projections"
category: intr
date: 2016-12-01 09:22:25
disqus: 1
---

D3js makes drawing maps in different projections extremely easy. You can choose from the most common ones to a really exotic set of projections that you never heard of before.

Projected rasters
-----------------

Usually, all the examples assume that the original data has got vector format and in a lat-lon (Equirectangular) projection, which isn't true.

To handle these situations, we need to transform the data to the lat-lon projection first, and then draw the map as usual:

<img src="{{ site.baseurl }}/images/projections/proj_transform.svg" width="500" />

Let's see an actual example of this. The [WRF model](Usually, all the examples assume that the original data has got vector format and in a lat-lon (Equirectangular) projection.) of the example runs in the Conic Conformal projection.

* One solution, of course, is to re-project the GeoTIFF with the [GDAL warp program](http://www.gdal.org/gdalwarp.html) and use this file as usual
  * This raster re-projection interpolates the data, so the final result is a bit different if the number of pixels isn't very high (which is the case)
* The other solution is reading the original file and re-project all the data we need before passing it to the [d3js geoProjection](https://github.com/d3/d3-geo#projections)

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-barbs-projected.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/wind-barbs-projected-page.html). The code is similar to the [isobands]({{ site.baseurl }}{% post_url 2016-12-13-isobands %}) and [wind barbs]({{ site.baseurl }}{% post_url 2016-12-11-arrows-and-barbs %}) examples, so I'll comment the differences:
{% highlight js %}
<script src="reproject.js"></script>
<script src="proj4.js"></script>
{% endhighlight %}

* For each barb, which is located in a point, we'll use the [proj4js](http://proj4js.org/) library to get the point projected coordinates
* To reproject the isobands, we'll use the [reproject](https://github.com/perliedman/reproject) library, which reprojects GeoJSON data directly

{% highlight js %}
var projection = d3.geoConicConformal()
    .rotate([82, 0])
    .center([0, 34.83158])
    .parallels([30, 60])
    .scale(2300)
    .translate([width / 2, height / 2]);
{% endhighlight %}

* Remember that the d3js projection will be used to draw the data once we have it in lat-lon, but that the GeoTIFF is in Conical Conformal

{% highlight js %}
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
{% endhighlight %}

* The original projection is defined in [WKT](http://www.geoapi.org/3.0/javadoc/org/opengis/referencing/doc-files/WKT.html)
  * You can run [gdalinfo [filename]](http://www.gdal.org/gdalinfo.html) on the GeoTIFF and this information will appear
  * It's [technically possible](http://cfconventions.org/wkt-proj-4.html) to read the GeoTIFF metadata and read this information automatically, but a whole library would be required
* The reproject library has the [toWgs84](https://github.com/perliedman/reproject#towgs84geojson-from-crss) function, that takes the GeoJSON (the isobands, in ur case) and the original projection, and transforms it into WGS84, which is what we need
  * Once the reprojection is done, the next steps are the same as usual

{% highlight js %}
var coords = projection.invert([x,y]);
coords = proj4(firstProjection).forward(coords);
{% endhighlight %}

* For each barb position, the iteration will give us the x and y pixel positions on the map
* *projection.invert([x,y])* will transform this position into lon-lat
* *proj4().forward()* will project this lon-lat to the original projection coordinates
* Then the [GeoTransform]({{ site.baseurl }}{% post_url 2016-12-30-geotransform %}) can be applied as usual, since it will be in the original coordinates too

Projected raster to interpolated raster
---------------------------------------
Creating [this kind of visualization]({{ site.baseurl }}/code_samples/raster-interpolation-page.html) from a projected GeoTIFF is also possible:

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/raster-interpolation-projected.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/raster-interpolation-projected-page.html).

{% highlight js %}
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
{% endhighlight %}

* The projection function is stored into a variable to speed the next process
  * The WKT of the projection is get as in the other case

{% highlight js %}
var coords = projection.invert([i,j]);
coords = geoTIFFProjection.forward(coords);

var px = (coords[0] - geoTransform[0]) / geoTransform[1];
var py = (coords[1] - geoTransform[3]) / geoTransform[5];
{% endhighlight %}

* To draw pixel by pixel, the loop is the same as in the [raster interpolation example]({{ site.baseurl }}/code_samples/raster-interpolation-page.html)
* The difference is that the lon-lat coords given by d3js must be projected to the GeoTIFF projection with the function created before
* The geoTransform will be in the projected coordinates, so it's used as usual
* The speed is worse, of course, but it's still usable. It's important to use the *forward* method without creating the projectino every time (of course)

Project a single image
----------------------

If the problem is that you have an image and want to warp it to the D3js projection, you can follow [these instructions](http://bl.ocks.org/rasmuse/75fae4fee3354ec41a49d10fb37af551), that give this result:

<iframe width="600" height="800" src="https://cdn.rawgit.com/rasmuse/75fae4fee3354ec41a49d10fb37af551/raw/0a91d6f75b95b90bda15a074ced45de454bb038f/index.html" frameborder="0"></iframe>
