// layer-generator.js ole examples
// Most of this code was extracted from the layer-generator.html file to make debugging easier.
//
import {Map, View} from "ol";
import {defaults as default_controls} from "ol/control";
import MousePosition from "ol/control/MousePosition";
import $ from 'jquery/dist/jquery.min.js';

// development version
//import {LayerGenerator, StyleGenerator} from "/src";
// package test version
import {LayerGenerator, StyleGenerator} from '/dist/ole';

var map;

document.getElementById('get-caps').addEventListener('click', function() {
    var capsUrl = document.getElementById('caps-url').value;
    if (capsUrl.charAt(capsUrl.length - 1) === '?') {
	capsUrl = capsUrl.substring(0, capsUrl.length - 1);
    }
    $.ajax({
	url: capsUrl,
	jsonp: 'callback',
	dataType: 'jsonp',
	data: {
	    f: 'json'
	},
	success: function(config) {
	    if (config.error) {
		alert(config.error.message + '\n' +
		      config.error.details.join('\n'));
	    } else {
		var generator = new LayerGenerator({config: config, url: capsUrl});
		var layer = generator.createLayer();
		var fullExtent = generator.getFullExtent();
		var resolutions = generator.getResolutions();
		var projection = generator.getProjection();
		if (!map) {
		    map = new Map({
			controls: default_controls().extend([
			    new MousePosition()]),
			layers: [layer],
			target: 'map',
			view: new View({
			    resolutions: resolutions,
			    projection: projection
			})
		    });
		} else {
		    map.getLayers().clear();
		    map.setView(new View({
			resolutions: resolutions,
			projection: projection
		    }));
		    map.addLayer(layer);
		}
		map.getView().fit(fullExtent, map.getSize());
	    }
	}
    });
});
