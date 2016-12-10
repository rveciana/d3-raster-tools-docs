---
layout: page
title: "Color scales"
category: intr
date: 2016-12-09 10:29:02
disqus: 1
---
When drawing lines or areas, we usually want to color them depending on the value they represent.

D3js
----
D3js provides (of course) an easy way to create color scales, called [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic). Many color scales are already created, and accessing to their colors is easy:

{% highlight js %}
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script>
var yellow = d3.interpolateYlGn(0), // "rgb(255, 255, 229)"
    yellowGreen = d3.interpolateYlGn(0.5), // "rgb(120, 197, 120)"
    green = d3.interpolateYlGn(1); // "rgb(0, 69, 41)"
</script>
{% endhighlight %}

* Just choose the color scale function [from the docs](https://github.com/d3/d3-scale-chromatic)
  * There are sequential, diverging and categorical color schemes. The last ones are just an array
* Call the function passing a value from 0 to 1 to get the color in all the domain
  * To calculate this value from 0 to 1 given the actual value, just call a *d3.scaleSequential* function, and don't forget to clamp it

{% highlight js %}
var color = d3.scaleSequential(d3.interpolatePiYG)
.domain([12, 23])
.clamp(true);
{% endhighlight %}

Using canvas
------------
When [drawing canvas pixel by pixel]({{ site.baseurl }}{% post_url 2016-12-07-drawing-raster-data %}), using the D3js scales can be really unefficient. An alternative must be used. The tutorial will be using the method taken from the [plotty library](https://github.com/santilland/plotty):

* Create an object with the scale definitions ([the source code](https://github.com/santilland/plotty/blob/master/src/plotty.js) has many of them already done)
* Create a small hidden canvas with 255 columns and one line. Each column will represent a scale value, and could be larger for a smoother gradient
* Create a gradient for each change in the color scale
* When the hidden canvas is created, get its data and query it to get the colours

The code is:
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

The resulting color scale, that you can see if the *.style("display","none")* is removed, is:

<img src="{{ site.baseurl }}/images/color-scale/sample-scale.png" width="512" height="30" />

* The color scale definition *cs_def* takes the colors and the position of each color in the scale from 0 to 1.
* The scale is created 256 pixels width and 1 height, to act as an array with the colors. The width could be higher.
* *createLinearGradient* will create the color gradient and *gradient.addColorStop* will add a color change at each position
* The *getImageData().data* method returns an array with all the colors. The size will be 256 * 4, since it holds the RGBA values

The color for each value is calculated using this code:
{% highlight js %}
var c = Math.round((scaleWidth-1) * ((value - domain[0])/(domain[1]-domain[0])));
var alpha = 255;
if (c<0 || c > (scaleWidth-1)){
  alpha = 0;
}
var rValue  = csImageData[c*4];;
var gValue   = csImageData[c*4+1];
var bValue   = csImageData[c*4+2];
var aValue = alpha;
{% endhighlight %}

* The fisrt line calculates the position from 0 to 255. *domain[0]* is the minimum value, and *domain[1]* the maximum
* The alpha part is necessary to avoid strange colors if the value is below or above the extremes of the scale. It will set the transparency to 100%
* *csImageData* has all the colours, ocupying four positions each.
  * The alpha value could be read and set the same way
* Usually, this chunk of code will be inside a loop to set all the pixels, as you can see in the [drawing raster data section]({{ site.baseurl }}{% post_url 2016-12-07-drawing-raster-data %})
