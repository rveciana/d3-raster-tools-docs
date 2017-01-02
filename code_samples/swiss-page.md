---
layout: default
title: "Swiss data"
---

The data from the Swiss region used in some examples is taken from two sources.

DEM
---

The [SRTM page offers the interface](http://srtm.csi.cgiar.org/SELECTION/inputCoord.asp
) to select the zone. In this case, the zones are *srtm_38_03* and *srtm_39_03*.

To merge the zones and downscaling the resulting image, I resulting

    gdalwarp -te 5.7 45.7 10.7 47.9 -ts 1000 0 *tif swiss.tiff

Which will create a width=1000 pixels image.

Contour
-------

The border of switzerland is taken from this project: https://github.com/interactivethings/swiss-maps

Clone the project and run:

    make topo/ch-country.json REPROJECT=true
