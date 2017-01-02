---
layout: page
title: "Shaded relief"
category: plot
date: 2016-11-29 22:59:57
disqus: 1
---
The [shaded relief technique](http://www.reliefshading.com/) is a method for representing the topography which is prettier and intuitive.

It's possible to get a simple shaded relief representation using only DEM data. I based all the calculations on [this example](http://geoexamples.blogspot.com.es/2014/03/shaded-relief-images-using-gdal-python.html) made with python.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/dem-shaded.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/dem-shaded-page.html).

* The way to color the different height values is the same as in the [drawing raster data]({{ site.baseurl }}{% post_url 2016-12-07-drawing-raster-data %}) section, but clipping the image:

{% highlight js %}
context.clip();
context.drawImage(canvasShaded.node(), 0, 0);
context.drawImage(canvasRaster.node(), 0, 0);
context.restore();
{% endhighlight %}

* Note that the *canvasShaded* is pasted twice. The first time without clipping and adding a white rectangle to make the background smoother. The second one, with the clipping, to show a stronger effect on the colored zone

Calculating the shaded relief
-----------------------------

To calculate the shaded relief, a hidden canvas is created with this data:

{% highlight js %}
var azimuth = 315;
var angleAltitude = 45;
var azimuthrad = azimuth*Math.PI / 180;
var altituderad = angleAltitude*Math.PI / 180;
{% endhighlight %}

  * Changing these parameters, the relief will change its aspect
    * *azimuth* is the angle where the sun is, calculated from the north. Note that in the northern hemisphere, this angle is impossible, but it's more natural.
    * *angleAltitude* is the position of the sun from the horizon. Increasing the angle will make the image to have less contrast

{% highlight js %}
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
{% endhighlight %}

* Here is where the data is really calculated
* The loop iterates all the pixels, [as always when reading rasters]({{ site.baseurl }}{% post_url 2016-12-31-reading-raster-data %}), but the stored value is calculated
* The slope and aspect need the gradients. Those are calculated with the [central difference method](http://mathworld.wolfram.com/CentralDifference.html), since is the one that gave me the same results as the [Numpy gradient](https://docs.scipy.org/doc/numpy/reference/generated/numpy.gradient.html) function
  * Since the borders don't have both side pixels, a check has to be done and apply the correct case
  * The central difference, in this case, is a simple average of the left and right differences
  * The gradient is calculated in the *x* and *y* directions
* The slope is simply thearctan of the module of the gradient in both directions
* The aspect is the direction of the slope. It's important to note which component and sign goes first.
* Once the slope and aspect are calculated, the shaded relief data is directly calculated

{% highlight js %}
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
{% endhighlight %}

* Once the shaded relief data is known, the image of the shaded relief is calculated taking the closest pixel for each image pixel
