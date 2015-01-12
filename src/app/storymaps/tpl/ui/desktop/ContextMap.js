define(["dojo/topic",
	"dojo/_base/array",
	"dojo/dom-geometry",
	"esri/arcgis/utils",
	"lib-build/css!./ContextMap"],
	function(topic,
		array,
		domGeom,
		arcgisUtils){

	var _map,
	_points;

	$('#context-map-helper').click(function(){
		$('#context-map-helper').removeClass('active');
	});

	topic.subscribe("story-load-section", function(index){
		console.log('testing');
		setIconDisplay(index);
	});

	topic.subscribe("tpl-ready", function(){
		createMap();
	});

	function createMap(){
		arcgisUtils.createMap('56fa6622c4f44e69af8f874411a0a11a','context-map',{
			mapOptions: {
				logo: false,
				showAttribution: false,
				slider: true,
				maxZoom: 4,
				minZoom: 1
			}
		}).then(function(response){
			_map = response.map;

			if (_map.loaded){
				setPointLayer();
			}
			else{
				_map.on('load',function(){
					setPointLayer();
				});
			}
		});
	}

	function setPointLayer(){
		array.forEach(_map.graphicsLayerIds,function(lyr){
			if (lyr.search('featColl') >= 0){
				_points = _map.getLayer(lyr);
			}
		});

		if (_points){
			setIconDisplay(0);
			
			_points.on('click',function(event){
				$('#context-map-helper').removeClass('active');
				topic.publish('story-navigate-section', event.graphic.attributes.index);
			});

			_points.on('mouse-over',function(event){
				_map.setCursor('pointer');
				setContextMapInfo(event.graphic);
			});

			_points.on('mouse-out',function(){
				_map.setCursor('default');
				hideContextMapInfo();
			});

			_map.on('extent-change',function(){
				_map.setCursor('default');
				hideContextMapInfo();
			});
		}
	}

	function setIconDisplay(index){
		if (_points && index !== null){
			array.forEach(_points.graphics,function(g){
				if (g.attributes.index === index){
					g.attributes.active = 'TRUE';
					if(g.getDojoShape()){
						g.getDojoShape().moveToFront();
					}
					_map.centerAt(g.geometry);
				}
				else{
					g.attributes.active = 'FALSE';
				}
			});
			_points.redraw();
		}
	}

	function setContextMapInfo(graphic){
		$('#context-map-info').html(graphic.attributes.city + ', ' + graphic.attributes.country);
		if (graphic.getDojoShape()){
			graphic.getDojoShape().moveToFront();
		}
		positionContextMapInfo(graphic);
	}

	function positionContextMapInfo(graphic){
		var pos = domGeom.position(graphic.getNode());
		$('#context-map-info').css({
			'top': pos.y - (pos.h/2) - 3,
			'left': pos.x + pos.w
		}).show();
	}

	function hideContextMapInfo(){
		$('#context-map-info').hide();
	}

});