---
layout: default
title: "Color scale isobands"
---
This example shows how to use the [color scale chooser]({{ site.baseurl }}/code_samples/color-scale-page.html) with the [raster-marching-squares](https://github.com/rveciana/raster-marching-squares) library. Click on the color scale to change, remove or add the colors and values.

* Take a look at [this example]({{ site.baseurl }}/code_samples/color-scale-page.html) to see how does the *color scale chooser* work
* [This section]({{ site.baseurl }}{% post_url 2016-12-13-isobands %}) shows how to use the library to calculate the isobands

<iframe frameborder="no" border="0" scrolling="no" marginwidth="0" marginheight="0" width="690" height="510" src="{{ site.baseurl }}/code_samples/color-scale-isobands.html"></iframe>

{% highlight js %}
<!DOCTYPE html>
<meta charset="utf-8">
<style>

</style>
<body>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="geotiff.min.js"></script>
<script src="raster-marching-squares.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script src="color-scale.js"></script>

<script>
var width = 680,
    height = 500;
var projection = d3.geoAzimuthalEqualArea()
    .rotate([-55.5, -24])
    .scale(1100);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var bandsGroup = svg.append("g")
  .attr("class", "bands");
var basemapGroup = svg.append("g")
  .attr("class", "base");
var scaleGroup = svg.append("g")
  .attr("class", "scale");

d3.request("tz850.tiff")
  .responseType('arraybuffer')
  .get(function(error, tiffData){
d3.json("world-110m.json", function(error, topojsonData) {
  var countries = topojson.feature(topojsonData, topojsonData.objects.countries);

  var tiff = GeoTIFF.parse(tiffData.response);
  var image = tiff.getImage();
  var rasters = image.readRasters();
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];

  var tempData = new Array(image.getHeight());
  for (var j = 0; j<image.getHeight(); j++){
      tempData[j] = new Array(image.getWidth());
      for (var i = 0; i<image.getWidth(); i++){
          tempData[j][i] = rasters[1][i + j*image.getWidth()];
      }
  }

  var scaleValues = [{value: 14, color: "#053061"},
  {value: 17, color: "#2a71ae"},
  {value: 20, color: "#6bacd0"},
  {value: 23, color: "#bfdceb"},
  {value: 26, color: "#f2efee"},
  {value: 29, color: "#faccb4"},
  {value: 32, color: "#e48268"},
  {value: 35, color: "#b82d35"}];


  var scale = d3.ColorScaleChooser()
    .squareWidth(50)
    .scaleValues(scaleValues)
    .title("Temp 850hPa (C)")
    .on("change", function(d){
      var intervals = d.map(function(i){return i.value;});
      var bands = rastertools.isobands(tempData, geoTransform, intervals);
      svg.select(".bandsChange")
      .transition()
      .style("opacity", 0)
      .remove();
      var bandsGroupChange = bandsGroup.append("g")
        .attr("class", "bandsChange");

      bands.features.forEach(function(d, i) {
        bandsGroupChange.insert("path", ".streamline")
            .datum(d)
            .attr("d", path)
            .style("fill", scaleValues[i].color)
            .style("stroke", "None")
            .style("opacity", 0)
            .transition()
            .style("opacity", 1);

        });

    });



  basemapGroup.insert("path", ".map")
      .datum(countries)
      .attr("d", path)
      .style("opacity", "0.4")
      .style("fill", "#ccc")
      .style("stroke", "#777")
      .style("stroke-width", "1.5px");


  scaleGroup.call(scale);

});
});
</script>

</body>
{% endhighlight %}
