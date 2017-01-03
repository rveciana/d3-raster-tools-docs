---
layout: default
title: "Color scale"
---
I didn't find a tool to edit the colors on a map, so I created a small JavaScript library to help doing it: *Color scale chooser*. The [source code is here]({{ site.baseurl }}/code_samples/color-scale.js).

Using it is easy:

{% highlight js %}
var svg = d3.select("body")
  .append("svg")
  .attr("width", 200)
  .attr("height", 400);

var scaleValues = [{value: 0, color: "#c9d5a6"},
  {value: 100, color: "#7fa67a"},
  {value: 300, color: "#79750a"},
  {value: 400, color: "#7ab5e3"},
  {value: 500, color: "#fefefe"},
  {value: 200, color: "#976a2f"}];

var scale = d3.ColorScaleChooser()
  .scaleValues(scaleValues);

svg.call(scale);
{% endhighlight %}

* Create an SVG (or a group in an SVG) to append the color scale chooser
* Create an instance of the *color scale chooser*
  * There are many options to pass. In this case, an initial color scale is passed
* Call the *color scale chooser* instance from the SVG (or an element in the SVG)

This will draw a scale like the one in the example below. Clicking on the colors will open an edit dialog, where the color and scale value can be changed. Also, by clicking on the cross sign over each color, the interval is removed. More intervals can be added with the upper rectangle.

There are some options to pass to the instance:

* *.squareWidth(width)* sets the width of each square in pixels. The default is 80
* *.squareHeight(height)* sets the height of each square in pixels. The default is 40
* *.scaleValues(obj)* sets the initial color scale. The array must be in the format shown in the example
  * Each element must be an object with the *value* and the *color* keys
* *.title(title)* adds a title with the text above the scale. The default is *null*, so no title is added
* *.addText(add text)* changes the text of the *add button*. By default is *add*
* *.on("change", function)* adds a function to trigger when a change on the scale occurs
  * The triggered event is *change*, but more events could be added

Example
-------
For more complicated (and useful) examples, check the [color scale isobands]({{ site.baseurl }}/code_samples/color-scale-isobands-page.html) and the [color scale interpolation]({{ site.baseurl }}/code_samples/color-scale-interpolation-page.html) examples.

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/color-scale.html"></iframe>

The important part of the example is the function in the *on* part of the instance. Generates a canvas with the gradient as explained in the [color scales]({{ site.baseurl }}{% post_url 2016-12-09-color-scales %}) section.

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<style>

</style>
<body>
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="color-scale.js"></script>
<script>

var scaleValues = [{value: 0, color: "#c9d5a6"},
{value: 100, color: "#7fa67a"},
{value: 300, color: "#79750a"},
{value: 400, color: "#7ab5e3"},
{value: 500, color: "#fefefe"},
{value: 200, color: "#976a2f"}];

var squareWidth = 80, squareHeight = 30;


var svg = d3.select("body")
  .append("svg")
  .attr("width", 200)
  .attr("height", 400);

var scale = d3.ColorScaleChooser()
  .squareWidth(50)
  .scaleValues(scaleValues)
  .title("Altitude (m)")
  .on("change", function(d, min, max){
    var scaleWidth = 500;
    d3.select("#colorScale").remove();
    var canvasColorScale = d3.select("body").append("canvas")
      .attr("id", "colorScale")
      .attr("width", scaleWidth)
      .attr("height", 20);
    var contextColorScale = canvasColorScale.node().getContext("2d");
    var gradient = contextColorScale.createLinearGradient(0, 0, scaleWidth, 1);
    for (var i = 0; i < d.length; ++i) {
      gradient.addColorStop((d[i].value-min)/(max-min), d[i].color);
    }
    contextColorScale.fillStyle = gradient;
    contextColorScale.fillRect(0, 0, scaleWidth, 20);
  });

svg.call(scale);
</script>
{% endhighlight %}
