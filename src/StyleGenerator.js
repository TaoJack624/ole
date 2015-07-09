/* global ol */
export default class StyleGenerator {
  constructor() {
    this._converters = {};
    this._converters.esriPMS = StyleGenerator._convertEsriPMS;
    this._converters.esriSFS = StyleGenerator._convertEsriSFS;
    this._converters.esriSMS = StyleGenerator._convertEsriSMS;
    this._renderers = {};
    this._renderers.uniqueValue = this._renderUniqueValue;
    this._renderers.simple = this._renderSimple;
    this._renderers.classBreaks = this._renderClassBreaks;
  }
  static _convertPointToPixel(point) {
    return Math.ceil(point / 0.75);
  }
  static _transformColor(color) {
    // alpha channel is different, runs from 0-255 but in ol3 from 0-1
    return [color[0], color[1], color[2], color[3] / 255];
  }
  /* convert an Esri Picture Marker Symbol */
  static _convertEsriPMS(symbol) {
    var width = StyleGenerator._convertPointToPixel(symbol.width);
    var img = document.createElement('img');
    img.src = 'data:' + symbol.contentType + ';base64, ' + symbol.imageData;
    return new ol.style.Style({
      image: new ol.style.Icon({
        img: img,
        imgSize: [img.width, img.height],
        scale: width / img.width
      })
    });
  }
  /* convert an Esri Simple Fill Symbol */
  static _convertEsriSFS(symbol) {
    var fill = new ol.style.Fill({
      color: StyleGenerator._transformColor(symbol.color)
    });
    var stroke = new ol.style.Stroke({
      color: StyleGenerator._transformColor(symbol.outline.color)
    });
    return new ol.style.Style({
      fill: fill,
      stroke: stroke
    });
  }
  /* convert an Esri Simple Marker Symbol */
  static _convertEsriSMS(symbol, optSize) {
    if (symbol.style === 'esriSMSCircle') {
      // TODO implement outline style (e.g. "esriSLSSolid")
      var circle = new ol.style.Circle({
        radius: optSize ? optSize : symbol.size,
        fill: new ol.style.Fill({
          color: StyleGenerator._transformColor(symbol.color)
        }),
        stroke: new ol.style.Stroke({
          color: StyleGenerator._transformColor(symbol.outline.color),
          width: symbol.outline.width
        })
      });
      return new ol.style.Style({
        image: circle
      });
    }
  }
  _renderSimple(renderer) {
    return this._converters[renderer.symbol.type].call(this, renderer.symbol);
  }
  _renderClassBreaks(renderer) {
    var field = renderer.field;
    var minDataValue = renderer.visualVariables[0].minDataValue;
    var maxDataValue = renderer.visualVariables[0].maxDataValue;
    var minSize = renderer.visualVariables[0].minSize;
    var maxSize = renderer.visualVariables[0].maxSize;
    var sizes = [];
    var size = minSize;
    var symbol = renderer.classBreakInfos[0].symbol;
    while (size <= maxSize) {
      sizes.push(StyleGenerator._convertPointToPixel(size));
      size += minSize;
    }
    var classes = [];
    var min = minDataValue;
    var geomFunction = function(feature) {
      var geometry = feature.getGeometry();
      if (geometry && geometry instanceof ol.geom.Polygon) {
        return geometry.getInteriorPoint();
      }
    };
    var increment = (maxDataValue - minDataValue) / sizes.length;
    var i, ii;
    for (i = 0, ii = sizes.length; i < ii; ++i) {
      var style = this._converters[symbol.type].call(this, symbol, sizes[i]);
      style.setGeometry(geomFunction);
      classes.push({min: min, max: min + increment, style: style});
      min += increment;
    }
    return (function() {
      return function(feature) {
        var value = feature.get(field);
        for (i = 0, ii = classes.length; i < ii; ++i) {
          if (value >= classes[i].min && value <= classes[i].max) {
            return [classes[i].style];
          }
        }
      };
    }());
  }
  _renderUniqueValue(renderer) {
    var field = renderer.field1;
    var infos = renderer.uniqueValueInfos;
    var me = this;
    return (function() {
      var hash = {};
      for (var i = 0, ii = infos.length; i < ii; ++i) {
        var info = infos[i], symbol = info.symbol;
        hash[info.value] = [me._converters[symbol.type].call(me, symbol)];
      }
      return function(feature) {
        return hash[feature.get(field)];
      };
    }());
  }
  generateStyle(drawingInfo) {
    return this._renderers[drawingInfo.renderer.type].call(this, drawingInfo.renderer);
  }
}