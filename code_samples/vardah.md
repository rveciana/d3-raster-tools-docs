---
layout: default
title: "Vardah cyclone file"
---

vardah.tiff
-----------

vardah.tiff is the GFS model output for 12-des-2016, the day that [Vardah cyclone](https://en.wikipedia.org/wiki/Cyclone_Vardah) made landfall in India.

This data is used in some examples, and was taken from: http://www.ftp.ncep.noaa.gov/data/nccf/com/gfs/prod/gfs.2016121200/

Using gdalinfo I got the bands of interest, but, since the pressure is at the land surface, not corrected to the sea level, which is the common data to see, I made this small script to get the fields:

{% highlight python %}
import gdal
import osr
ds = gdal.Open("gfs.t00z.sfluxgrbf00.grib2")
gph = ds.GetRasterBand(84).ReadAsArray()
press = ds.GetRasterBand(54).ReadAsArray() / 100
temp = ds.GetRasterBand(52).ReadAsArray()
u = ds.GetRasterBand(50).ReadAsArray()
v = ds.GetRasterBand(51).ReadAsArray()

corr_press = press * (1 - (0.0065*gph/(0.0065*gph + temp  + 273.15)))**-5.257

driver = gdal.GetDriverByName('GTiff')
outRaster = driver.Create("/tmp/gfs.tiff", ds.RasterXSize, ds.RasterYSize, 4, gdal.GDT_Float32)
outRaster.SetGeoTransform(ds.GetGeoTransform())

outband = outRaster.GetRasterBand(1)
outband.WriteArray(corr_press)
outband.SetMetadata({'name': 'press'})

outband = outRaster.GetRasterBand(2)
outband.WriteArray(temp)
outband.SetMetadata({'name': 'temp'})

outband = outRaster.GetRasterBand(3)
outband.WriteArray(temp)
outband.SetMetadata({'name': 'u'})

outband = outRaster.GetRasterBand(4)
outband.WriteArray(temp)
outband.SetMetadata({'name': 'v'})

outRasterSRS = osr.SpatialReference()
outRasterSRS.ImportFromEPSG(4326)
outRaster.SetProjection(outRasterSRS.ExportToWkt())
outband.FlushCache()

{% endhighlight %}

Finally, runned

    gdal_translate -projwin 70 20 92 4 /tmp/gfs.tiff /tmp/vardah.tiff

To clip the image around the cyclone and decrease the file size.
