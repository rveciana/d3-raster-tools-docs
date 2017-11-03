---
layout: page
title: "Alternative raster formats"
category: intr
date: 2016-11-28 09:22:25
disqus: 1
---
All this tutorial is working with GeoTIFF files, but there are other options.

Table of contents
-----------------

- [The data](#the-data)
- [GeoTIFF](#geotiff)
  * [Compression](#compression)
  * [HTML example](#html-example)
- [NetCDF](#netcdf)
  * [HTML example](#html-example-1)
  * [HTML example](#html-example-2)
- [JSON with encoded data](#json-with-encoded-data)
  * [HTML example](#html-example-3)
- [Binary data](#binary-data)
  * [HTML example](#html-example-4)
- [LZW compressed binary data](#lzw-compressed-binary-data)
  * [File creation using Python](#file-creation-using-python)
  * [HTML example](#html-example-5)
- [Performance comparison](#performance-comparison)
- [What to do with all this binary data?](#what-to-do-with-all-this-binary-data)
- [Links](#links)

The data
--------

All the examples use the data from [this block][2]. You can see [how I got the data here][3]. I have taken only the first layer (msl pressure) to make the examples simpler:

    gdal_translate -b 1 vardah.tiff vardah_new.tiff

You can [download here][4] the original [vardah.tiff][4] file.

GeoTIFF
-------
As in the original example, GeoTIFF can be used as a way to get the raster data. It's got many advantages, such as being the most widespread format, able to be compressed, that it's possible to open it directly with any GIS program such as QGIS.

To use it, use the [geotiff.js library][5]. 

### Compression
The compressed images are read directly by the latest versions of the library. The compression can reduce the size a lot, specially with the *Deflate* option. The parsing time is bigger when the image is compressed, but the time is acceptable.

To create a compressed GeoTIFF file, use the gdal creation options:

    gdal_translate -of GTiff -co COMPRESS=DEFLATE vardah.tiff vardah2.tiff
    gdal_translate -of GTiff -co COMPRESS=LZW vardah.tiff vardah2.tiff
    gdal_translate -of GTiff -co COMPRESS=PACKBITS vardah.tiff vardah2.tiff

Other compression options are not available with the geotiffjs library.

Another thing to take in account is the metadata. The geotransform data is stored in a quite strange way (see tiepoint and pixelscale in the [example][1], and the GDAL metadata, in a special "GDAL" tag, which is not easy to find, although it is not when using python+GDAL.

### HTML example
{% highlight js %}
<!DOCTYPE html>
<html>
    <meta>
    <script src='geotiff.min.js'></script>
    </meta>

    <body>
<script>

var urlpath =  "vardah.tiff"

var oReq = new XMLHttpRequest();
oReq.open("GET", urlpath, true);
oReq.responseType = "arraybuffer";

oReq.onload = function(oEvent) {
  var t0 = performance.now();
  var tiff = GeoTIFF.parse(this.response);
  var image = tiff.getImage();
  var data = image.readRasters()[0];
  var tiepoint = image.getTiePoints()[0];
  var pixelScale = image.getFileDirectory().ModelPixelScale;
  var t1 = performance.now();
  console.log("Decoding took " + (t1 - t0) + " milliseconds.")
};
oReq.send(); //start process
</script>
{% endhighlight %}

* Note that the request must be set with an *arraybuffer* *responsetype* 

NetCDF
------
NetCDF is a popular format among meteorology data. The format is quite simple and very flexible. As in the case of GeoTIFF, GDAL can write NetCDF files with a special form and there is a [JavaScript library, netcdfjs][6] that reads the format and it's fast and not very big. It can be opened with QGIS if created with GDAL.

To create a NetCDF file from a GeoTIFF, just run:

    gdal_translate -of netCDF -b 1 vardah.tiff vardah.nc

The name of the output band will be *Band1*, which is not very nice, since the actual name is stored in another field, not the one used to retrieve the data.

### HTML example
{% highlight js %}
<!DOCTYPE html>
<html>
    <meta>
    <script src='netcdfjs.js'></script>
    </meta>

    <body>
<script>

var urlpath =  "vardah.nc"
var reader;

var oReq = new XMLHttpRequest();
oReq.open("GET", urlpath, true);
oReq.responseType = "blob";

oReq.onload = function(oEvent) {
  var t0 = performance.now();    
  var blob = oReq.response;
  reader_url = new FileReader();
  
  reader_url.onload = function(e) {
    var t0 = performance.now();
    reader = new netcdfjs(this.result);
    var dataValues = reader.getDataVariable('Band1');
    var t1 = performance.now();
    console.log("Decoding took " + (t1 - t0) + " milliseconds.")
  }
      
  var arrayBuffer = reader_url.readAsArrayBuffer(blob);
  
};
oReq.send(); //start process


</script>
{% endhighlight %}

* The variables *lat* and *lon* return the geographical coordinates for every pixel, which is a good feature
* Some metadata is stored in different variables and fields. Take a look to the library api to see them, but:
    * Printing *reader.variables* will output a set ob objects with the projection information, longitudes and latitudes
    * *reader.dimensions* stores the matrix size
    * *globalAttributes* stores other metadata, such as the creation date, GDAL information, etc
* Note that the request must be set with a *blob* *responsetype* 
JSON
----

This format is the first that comes in mind when thinking about sharing data. It's the easiest to understand, and reading it is the most simple thing to code. But it's a bad idea using it with medium sized matrices, since the size can be for times or more than the original uncompressed GeoTIFF.

### HTML example
{% highlight js %}
<!DOCTYPE html>
<html>
    <body>

<script>

var oReq = new XMLHttpRequest();


oReq.addEventListener("load", function(data){
    var t0 = performance.now();
    var jsonData = JSON.parse(this.response);
    var t1 = performance.now();
    console.log("Decoding took " + (t1 - t0) + " milliseconds.")
    
});

oReq.open("GET", "vardah.json");
oReq.send();


</script>
{% endhighlight %}

* Just parse the JSON file!
* Of course, all the metadata is easy to add, so the format is very flexible

Creating the JSON sample file using python is easy:

{% highlight python %}
import gdal
import json
from base64 import b64encode
import struct

d_s = gdal.Open("vardah.tiff")
data = d_s.GetRasterBand(1).ReadAsArray()
print(data.dtype)
out_data = []
print("Size:", data.shape)
for j in range(data.shape[0]):
    for i in range(data.shape[1]):
        out_data.append(float(data[j][i]))

json_data = {}
json_data['nx']= data.shape[1]
json_data['ny']= data.shape[0]
json_data['data'] = out_data

fp = open("vardah.json", "w")
fp.write(json.dumps(json_data))
fp.close()

{% endhighlight %}

* To make consistent data, put all the numbers in a list, but a matrix could be created the same way, and could be more convenient in certain cases

JSON with encoded data
----------------------
Plain JSON data is expensive in terms of space. What if we encode the data in [Base64][7]? The data will be much smaller and the JSON format can store all the metadata we want with the same flexibility.

Let's look first at how can we create the sample file:

{% highlight python %}
import gdal
import json
from base64 import b64encode
import struct

d_s = gdal.Open("vardah.tiff")
data = d_s.GetRasterBand(1).ReadAsArray()
print(data.dtype)
out_data = []
print("Size:", data.shape)
for j in range(data.shape[0]):
    for i in range(data.shape[1]):
        out_data.append(float(data[j][i]))

json_data = {}
json_data['nx']= data.shape[1]
json_data['ny']= data.shape[0]

b64 = b64encode(struct.pack(str(len(out_data))+'f', *out_data)).decode("utf-8")

json_data['data'] = b64
fp = open("vardahb64.json", "w")
fp.write(json.dumps(json_data))
fp.close()
{% endhighlight %}

* Just encode the list after packing it as a binary string
    * I have packed the elements using a *f*, so as float32 values. If this is changed, remember to change the decoding part! Some variables such as classifications can be stored as bytes, which is much more efficient
    * The *b64encode* function returns in bytes, so it has to be encoded to utf-8 to serialize it into a JSON

### HTML example
{% highlight js %}
<!DOCTYPE html>
<html>
    <body>

<script>

var oReq = new XMLHttpRequest();


oReq.addEventListener("load", function(data){
    var t0 = performance.now();
    var jsonData = JSON.parse(this.response);
    var data = atob(jsonData['data']);
    var b = new Uint8Array(
            data.split("").map(function(d){return String.charCodeAt(d)})
        );
    var float32Data = new Float32Array(b.buffer);
    var t1 = performance.now();
    console.log("Decoding took " + (t1 - t0) + " milliseconds.")
    
});

oReq.open("GET", "vardahb64.json");
oReq.send();
</script>
{% endhighlight %}

Reading this data is quite efficient, but not as easy as plain JSON. The steps are:

* Parse the JSON data with the *JSON.parse* function
* Convert the encoded field to a binary string using the *atob* function. This decodes the *base64 string*
* Retrieve all the bytes
    * By splitting all the chars in the string, map all the characters to the UTF-16 codes using *String.charCodeAt*
    * Put all the values to a [JavaScript typed array][8], so we can convert them later
* Since the values were stored as float32, we create a *buffer* from the unigned int8 array and convert the types. That's all

Binary data
-----------
Using binary data directly can be a bit more difficult, but the size is compact, the format is very flexible and the performance is very good. Also, it doesn't require any external library, which is very convenient in many cases. And since you control all the format, the original data can be obfuscated easily.

If we want to store metadata, different data types may be involved, making the scripts more complicated, but it's efficient and not so difficult to do.

Creating the file is easy:

{% highlight python %}
import gdal
import struct

d_s = gdal.Open("vardah.tiff")
data = d_s.GetRasterBand(1).ReadAsArray()
print(data.dtype)
out_data = []

for j in range(data.shape[0]):
    for i in range(data.shape[1]):
        out_data.append(float(data[j][i]))

fp = open("vardah.bin", "wb")
fp.write(struct.pack(str(len(out_data))+'f', *out_data))
fp.close()
{% endhighlight %}

* Just use the *pack* function to store the data
    * Note that the data is packed with the *f* letter, this is as float32 elements

### HTML example
Reading the binary data is really easy using [Javascript typed arrays][8]:
{% highlight js %}
<!DOCTYPE html>
<html>
    <body>
<script>
var oReq = new XMLHttpRequest();

oReq.addEventListener("load", function(data){
    var t0 = performance.now();    
    var floatArray= new Float32Array(this.response);
    var t1 = performance.now();
    console.log("Decoding took " + (t1 - t0) + " milliseconds.")
});

oReq.open("GET", "vardah.bin");
oReq.responseType = 'arraybuffer';
oReq.send();
</script>
{% endhighlight %}
* Note that the request must be set with an *arraybuffer* *responsetype* 
* Just read the responsa into a new Float32Array. All the values will be there

LZW compressed binary data
--------------------------
Of course, as in the [GeoTIFF](#geotiff) case, all the data can be compressed. Using complex compression algorithms makes you lose the advantage of coding everything without an external library, but the [LZW algorithm][9] is so simple that it can be added with a few lines of code.

I will use the code sample from the [rossetacode.org site][10].
### File creation using Python
{% highlight python %}
import gdal
import struct
from base64 import b64encode

'''
Compression algorithm
'''
def compress(uncompressed):
    """Compress a string to a list of output symbols."""
 
    # Build the dictionary.
    dict_size = 256
    dictionary = dict((chr(i), i) for i in xrange(dict_size))
    # in Python 3: dictionary = {chr(i): i for i in range(dict_size)}
    #dictionary = {chr(i): i for i in range(dict_size)}
 
    w = ""
    result = []
    for c in uncompressed:
        wc = w + c
        if wc in dictionary:
            w = wc
        else:
            result.append(dictionary[w])
            # Add wc to the dictionary.
            dictionary[wc] = dict_size
            dict_size += 1
            w = c
 
    # Output the code for w.
    if w:
        result.append(dictionary[w])
    return result

d_s = gdal.Open("vardah.tiff")
data = d_s.GetRasterBand(1).ReadAsArray()

out_data = []
for j in range(data.shape[0]):
    for i in range(data.shape[1]):
        out_data.append(float(data[j][i]))
out_data_bytes = struct.pack(str(len(out_data))+'f', *out_data)
compressed = compress(out_data_bytes)

fp = open("vardah.lzw.bin", "wb")
fp.write(struct.pack(str(len(compressed))+'H', *compressed))
fp.close()
{% endhighlight %}

* The compression function is copied directly from the [rossetacode.org site][10]
    * It's supposed to work with a string, so we will convert out floats list into a binary bytes string
* *pack* will convert the data list into a string with the binary data. The compressed data will be byte by byte
* The data is compressed with the function
* The data is written as a string of unsigned shorts. This is because the compressed data is a list with values from 0 to 65535, so the *unsigned short* will be the most efficient way to store its values

The size is reduced by 50% in our example. If a classification is used instead of float values, the compression will be much more efficient.
### HTML example
{% highlight js %}
<!DOCTYPE html>
<html>
    <body>
<script>
var oReq = new XMLHttpRequest();

oReq.addEventListener("load", function(data){
    var t0 = performance.now();    
    var compressedArray = new Uint16Array(this.response);
    console.info(compressedArray.length);
    var uncompressed = uncompress(compressedArray);
    
    var t1 = performance.now();
    console.log("Decoding took " + (t1 - t0) + " milliseconds.")

});

oReq.open("GET", "vardah.lzw.bin");
oReq.responseType = 'arraybuffer';
oReq.send();

//https://rosettacode.org/wiki/LZW_compression#JavaScript
function uncompress(compressed) {
        var i,
            dictionary = [],
            w,
            result,
            floatResult = [],
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }
 
        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
             result += entry;
 
            // Add w+entry[0] to the dictionary.
            dictionary[dictSize++] = w + entry.charAt(0);
 
            w = entry;
        }
        //Convert from chars to float32 array
        var b = new Uint8Array(
            result.split("").map(function(d){return String.charCodeAt(d)})
        );
        return new Float32Array(b.buffer);
    }
</script>
{% endhighlight %}
* As in the other cases, just cll the *uncompress* function and the float array data will be in the variable
* The *uncompress* function it the same of the one at the [rossetacode.org site][10], but modified to convert the bytes string to a [Float32Array][8]
    * By splitting all the chars in the string, map all the characters to the *UTF-16 codes* using *String.charCodeAt*
    * Put all the values to a *Uint8Array* JavaScript typed array, so we can convert them later
    * The unsigned short array is then converted to a *Float32Array* using buffers

Not so difficult! If some metadata has to be added, things can be a bit more complicated, specially if different types are involved

Performance comparison
----------------------
I run all the options so it's easy to compare the final file size and the time it takes to parse

| Format               | Size           | Parsing time  |
| -------------------- |:--------------:| -------------:|
| Uncompressed GeoTIFF | 102 kB         | 20 ms         |
| Packbits GeoTIFF     | 103 kB         | 80 ms         |
| LZW GeoTIFF          | 53 kB          | 54 ms         |
| Deflate GeoTIFF      | 40 kB          | 59 ms         |
| JSON                 | 490 kB         | 9 ms          |
| Base64 JSON          | 135 kB         | 12 ms         |
| Binary               | 101 kB         | 0.15 ms       |
| LZW binary           | 54 kB          | 14 ms         |

* GeoTIFF files, specially if compressed, are the smallest ones, but with the higher parsing time. Anyway, 60ms is a very good time, so it will be the usual method
* JSON files are the most inefficient in terms of space, and the parsing time is not as low as it could be, because there are many characters to parse
* Binary files are really fast to parse, and the size is quite small if compressed


[1]: http://geoexamples.com/d3-raster-tools-docs/
[2]: http://bl.ocks.org/rveciana/420a33fd0963e2a6aad16da54725af36
[3]: http://geoexamples.com/d3-raster-tools-docs/code_samples/vardah.html
[4]: bl.ocks.org/rveciana/raw/420a33fd0963e2a6aad16da54725af36/vardah.tiff
[5]: https://github.com/constantinius/geotiff.js
[6]: https://github.com/cheminfo-js/netcdfjs
[7]: https://en.wikipedia.org/wiki/Base64
[8]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
[9]: https://en.wikipedia.org/wiki/Lempel%E2%80%93Ziv%E2%80%93Welch
[10]: https://rosettacode.org/wiki/LZW_compression
[11]: http://geoexamples.com/d3-raster-tools-docs/