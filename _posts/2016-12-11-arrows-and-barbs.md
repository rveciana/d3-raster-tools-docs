---
layout: page
title: "Arrows and barbs"
category: plot
date: 2016-12-11 18:38:29
disqus: 1
---
When the values are a vector field instead of a scalar field (i.e. wind, wave directions, etc), small arrows or [barbs](http://weather.rap.ucar.edu/info/about_windbarb.html) are used.

* Note that we will be using wind values in the examples. The y-axis positive values are from south to north, so the opposite of the raster convention. That's why some minus signs will appear

Arrows
------


Barbs
-----
[Wind barbs](http://weather.rap.ucar.edu/info/about_windbarb.html) are a common way to represent the speed and direction of the wind. Each small line or triangle attached to the line indicating direction adds speed values. Let's see how to get them using D3js & Canvas:

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/wind-barbs.html"></iframe>

You can find [the whole code here]({{ site.baseurl }}/code_samples/wind-barbs-page.html)

{% highlight js %}
var xPos = d3.range(barbSize, width, barbSize);
var yPos = d3.range(barbSize, height, barbSize);

xPos.forEach(function(x){
  yPos.forEach(function(y){
{% endhighlight %}

* [d3.range](https://github.com/d3/d3-array/blob/master/README.md#range) returns an array of positions from 0 to the image size, each *barbSize* pixels. Very convenient in our case
* For each of these positions in the output image, an arrow will be calculated

{% highlight js %}
var coords = projection.invert([x,y]);
var px = Math.round((coords[0] - geoTransform[0]) / geoTransform[1]);
var py = Math.round((coords[1] - geoTransform[3]) / geoTransform[5]);
{% endhighlight %}

* From the image pixel position to a lat-lon position, the *projection.invert* method must be used
* The [GeoTransform]({{ site.baseurl }}{% post_url 2016-12-07-geotransform %}) is applied to get the pixel position in the original GeoTIFF file

{% highlight js %}
var angle = Math.atan2(-vData[py][px],uData[py][px]);
{% endhighlight %}

* The wind direction is calculated with the [atan2](https://en.wikipedia.org/wiki/Atan2) function, but changing the axis order and the y-axis sign so the 0 degrees start from the north and the original wind speed goes from south to north when positive
  * Check the [example image]({{ site.baseurl }}/code_samples/wind-barbs-page.html) to see that the result is correct

Now, the small lines indicating speed must be drawn, and the arrow rotated:
{% highlight js %}
var spd5 = Math.round(spdData[py][px]/5);
var spd10 = Math.floor(spd5/2);
spd5 = spd5%2;
var spd50 = Math.floor(spd10/5);
spd10 = spd10%5;
context.save();
context.translate(x, y);
context.rotate(angle);
context.beginPath();
context.strokeStyle = "#444";
context.fillStyle = "#444";

var pos = -barbSize/2;
var separation = 2.5;

for(var i=0; i<spd50; i++){
  context.moveTo(pos, 0);
  context.lineTo(pos+barbSize/8, barbSize/4);
  context.lineTo(pos+barbSize/4, 0);
  pos = pos + barbSize/4 + separation;
  context.fill();
}
for(var i=0; i<spd10; i++){
  context.moveTo(pos, 0);
  context.lineTo(pos, barbSize/3);
  pos = pos + separation
}
if(spd5==1){
  if (pos == -barbSize/2){
    pos = pos + separation
  }
  context.moveTo(pos, 0);
  context.lineTo(pos, barbSize/6);
}
if(spd5==0 && spd10== 0 && spd50==0){
  context.arc(0, 0, 4, 0, 2 * Math.PI, false);
} else {
  context.moveTo(-barbSize/2,0);
  context.lineTo(barbSize/2,0);
}
context.stroke();
context.restore();
{% endhighlight %}
* The most important thing to note is that the *context.translate()* and *context.rotate()* are used to put the origin of the drawing on the begining of the barb
  * This avoids complex calculations for the lines, since the barb can be thought always from left to right
* The system is, basically, to check if the speed is multiple of 50, 10 and 5, which are the small lines and triangle options. For each multiple, the line is drawn and a separation is added to the position so the next line is drawn properly
  * Also, it covers the case of *5<spd<10*, when a small separation must be added to distinguish the 5kt line from the 10kt line

### SVG version

The SVG version is very similar, but using [SVG transform](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform) .

You can find [the whole code here]({{ site.baseurl }}/code_samples/wind-barbs-svg-page.html)
{% highlight js %}
var g = svg.append("g")
.style("fill", "#444")
.style("stroke", "#444")
.attr("transform", "translate("+x+", "+y+")rotate("+angle+")");
{% endhighlight %}

* An SVG group is added for each barb. This way, all the lines, triangles and so on will be translated and rotated at the same time
* Note that the *translate* will make that the origin of the arrow is always at 0,0. This makes calculations much easier.
* The rotation is made after the translation. The order matters
