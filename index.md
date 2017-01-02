---
layout: default
title: "D3js raster tools docs"
disqus: 1
---

D3js raster tools docs
======================

This small documentation explains how to work with raster data and the [d3js](https://d3js.org/) to create dynamic data visualizations.

Usually, the examples show how to place points or polygons on a map. Those examples are working with [vectorial data](http://gis.stackexchange.com/questions/57142/what-is-the-difference-between-vector-and-raster-data-models ). But many datasets are rasters, so the lack of examples and libraries made difficult to use [d3js](https://d3js.org/) with meteorological data, [DEM data](https://en.wikipedia.org/wiki/Digital_elevation_model), etc.

Some common representations could be easily done with existing libraries, others didn't have available tools. This tutorial will show how to use:

* [geotiff](https://github.com/constantinius/geotiff.js): Reading the GeoTIFF data (not the projectiopn, which would be cool)
* [raster-streamlines](https://github.com/rveciana/raster-streamlines): Drawing [streamlines](https://en.wikipedia.org/wiki/Streamlines,_streaklines,_and_pathlines) from vectorial fields
* [raster-marching-squares](https://github.com/rveciana/raster-marching-squares): Creating the isobands with the wind speed
* [reproject](https://github.com/perliedman/reproject): Reprojecting the generated GeoJSON
* [proj4js](http://proj4js.org/): Reprojecting points

And examples for all the common raster visualizations covered by the [Basemap library](http://basemaptutorial.readthedocs.io/en/latest/). All the examples have the *Canvas* and the *SVG* version so it's easy to use the most convenient.

I would really appreciate all the feedback. Disqus comments are available on each page.

Section Examples list
---------------------

|----------|:-------------:|
|[<img src="{{ site.baseurl }}/images/examples/arrows.png" /> Wind arrows]({{ site.baseurl }}/code_samples/wind-arrows-page.html) | [<img src="{{ site.baseurl }}/images/examples/barbs.png" /> Wind barbs]({{ site.baseurl }}/code_samples/wind-barbs-page.html) |
|[<img src="{{ site.baseurl }}/images/examples/raster-interpolate.png" /> Raster interpolation]({{ site.baseurl }}/code_samples/raster-interpolation-page.html) | [<img src="{{ site.baseurl }}/images/examples/raster-pixel.png" /> Raster original pixels]({{ site.baseurl }}/code_samples/raster-pixels-page.html) |
|[<img src="{{ site.baseurl }}/images/examples/isolines.png" /> Isolines]({{ site.baseurl }}/code_samples/isolines-page.html) | [<img src="{{ site.baseurl }}/images/examples/isolines-labels.png" /> Isolines with labels]({{ site.baseurl }}/code_samples/isolines-labels-page.html) |
|[<img src="{{ site.baseurl }}/images/examples/isobands.png" /> Isobands]({{ site.baseurl }}/code_samples/isobands-page.html) | [<img src="{{ site.baseurl }}/images/examples/streamlines.png" /> Streamlines]({{ site.baseurl }}/code_samples/streamlines-arrows-page.html) |
|[<img src="{{ site.baseurl }}/images/examples/projection.png" /> Projected GeoTIFF]({{ site.baseurl }}/code_samples/wind-barbs-projected-page.html) | [<img src="{{ site.baseurl }}/images/examples/raster-interpolate-projection.png" /> Projected raster interpolation]({{ site.baseurl }}/code_samples/raster-interpolation-projected-page.html) |
|[<img src="{{ site.baseurl }}/images/examples/leaflet.png" /> Leaflet]({{ site.baseurl }}/code_samples/leaflet-page.html) |  [<img src="{{ site.baseurl }}/images/examples/dem-shaded.png" /> Shaded relief]({{ site.baseurl }}/code_samples/dem-shaded-page.html)|

Other visualization examples
----------------------------

|----------|:-------------:|
|[<img src="{{ site.baseurl }}/images/examples/vardah-layers.png" /> Layer selection]({{ site.baseurl }}/code_samples/vardah-layers-page.html) | [<img src="{{ site.baseurl }}/images/examples/vardah-streamlines.png" /> Animated streamlines]({{ site.baseurl }}/code_samples/vardah-streamlines-page.html) |
