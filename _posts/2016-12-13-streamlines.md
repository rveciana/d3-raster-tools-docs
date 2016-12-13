---
layout: page
title: "Streamlines"
category: plot
date: 2016-12-13 09:22:36
disqus: 1
---

[Streamlines](https://en.wikipedia.org/wiki/Streamlines,_streaklines,_and_pathlines) are the family of curves tangent to the velocity of the flow. They can be seen as the path that a particle would follow. They are widely used to show wind fields.

Calculating these streamlines is not so easy, so I made [this library](https://github.com/rveciana/raster-streamlines) that does the job and makes really simple to draw them.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/streamlines.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/streamlines-page.html)

Basically, after [reading the GeoTIFF data]({{ site.baseurl }}{% post_url 2016-12-07-reading-raster-data %}), the code is

{% highlight js %}
var lines = rastertools.streamlines(uData,vData, geoTransform);
lines.features.forEach(function(d) {
  context.beginPath();
  context.strokeStyle = "#000000";
  path(d);
  context.stroke();
});
{% endhighlight %}

* The *streamlines* function returns an array of paths
* The array is iterated for each element and directly drawn

These streamlines have the problem that the direction isn't indicated. To do it, the easiest way is using the [svg-path-properties](https://github.com/rveciana/svg-path-properties) library:

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/streamlines-arrows.html"></iframe>
You can find [the whole code here]({{ site.baseurl }}/code_samples/streamlines-arrows-page.html)

The important part of the code grows to:
{% highlight js %}
var path2 = d3.geoPath()
    .projection(projection);
var lines = rastertools.streamlines(uData,vData, geoTransform);
lines.features.forEach(function(d) {
  var properties = spp.svgPathProperties(path2(d));
  var arrowPos = properties.getPropertiesAtLength(properties.getTotalLength()/2);
  var arrowDegrees = Math.atan(arrowPos.tangentY/arrowPos.tangentX);
  context.beginPath();
  context.strokeStyle = "#000000";
  path(d);
  context.stroke();
  context.beginPath();
  context.moveTo(arrowPos.x, arrowPos.y);
  context.lineTo(arrowPos.x-10*arrowPos.tangentX + 6*arrowPos.tangentY,arrowPos.y-10*arrowPos.tangentY - 6*arrowPos.tangentX);
  context.moveTo(arrowPos.x, arrowPos.y);
  context.lineTo(arrowPos.x-10*arrowPos.tangentX - 6*arrowPos.tangentY,arrowPos.y-10*arrowPos.tangentY + 6*arrowPos.tangentX);
  context.stroke();
});
{% endhighlight %}

* Since the defined *geoPath* included the context, a ne path is created with the name *path2*. This will make easy to get the svg path for every streamline
* The *svgPathProperties* function allows us to get the position of the middle of the line and the direction. Note that the problems of the barbs with direction doesn't exist here
  * The streamline is written with the direction of the wind directly
  * There is a [parameter to change it](https://github.com/rvec(iana/raster-streamlines) called *flip*
* The arrows are drawn using the basic [Canvas lineTo function](http://www.w3schools.com/tags/canvas_lineto.asp)
