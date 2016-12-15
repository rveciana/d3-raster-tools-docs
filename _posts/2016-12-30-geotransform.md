---
layout: page
title: "GeoTransform"
category: intr
date: 2016-12-30 18:19:49
disqus: 1
---
In all the examples and functions the word *GeoTransform* will appear. It's a word that doesn't appear when talking about vectorial data. A *raster band* is a two dimension matrix with the magnitude value at each position or pixel. Since it's geographical data, each pixel is located somewhere on the Globe. The formula that converts the pixel position on the matrix to the map coordinates is called the *GeoTransform*.

I've been using the names and formulae taken from the [GDAL library](http://www.gdal.org/gdal_datamodel.html), which is the most used library in GIS. The formula is this one:

    Xgeo = GT(0) + Xpixel*GT(1) + Yline*GT(2)
    Ygeo = GT(3) + Xpixel*GT(4) + Yline*GT(5)

Where GT is the GeoTransform array, which has six positions:

* GT(0) and GT(3) set the image origin
  * The origin is the top left corner of the top left pixel in the raster
  * Note that the Y axis will usually go downwards (GT(5) is negative), since the map coordinates go usually upwards
* Xpixel is the column of the matrix and Yline the line
* All the parameters are in the raster projection (lat-lom, UTM, Mercator, etc)

<img src="{{ site.baseurl }}/images/geotransform/geotransform.svg" width="300" />

The figure shows the most common case, where the GT(2) and GT(4) terms are zero, so there is no rotation of the image. The formula would be:

    Xgeo = GT(0) + Xpixel*GT(1)
    Ygeo = GT(3) + Yline*GT(5)

So, if you need the inverse equation to calculate the raster pixel given the map coordinates, just use:

    Xpixel = (Xgeo - GT(0))/GT(1)
    Ypixel = (Ygeo - GT(3))/GT(5)


example
-------

If the coordinates are lat-lon, a possible GeoTransform could be:

    GT = [33, 0.1, 0, 45, 0, -0.1]

So the pixel at column 10 and line 10 would be *Xgeo = 34* and *Ygeo = 44*.
