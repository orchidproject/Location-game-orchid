//states var IDEL_TAB_1_STATE = 0; 
var IDEL_TAB_3_STATE = 1;
var IDEL_TAB_2_STATE = 2;
var SET_LOCATION = 3;

var widgets = {
	top_left_marker: new google.maps.Marker({
		icon:"/img/mapeditor/start_location.png",
	}),
        grid: null 
}
var mapUtility =  {
	makebounds: function( nw, metersEast, metersSouth ) {
			    var ne = google.maps.geometry.spherical.computeOffset(
				nw, metersEast, 90
			    );
			    var sw = google.maps.geometry.spherical.computeOffset(
				nw, metersSouth, 180
			    );
			    return new google.maps.LatLngBounds( sw, ne );
			}				
}

function switch_tab(tab){
	switch(tab){
		case 0:
			showTasks();	
		break;
		case 1:
			showDropOffZone();
		break;
		case 2:
			widgets.top_left_marker.setPosition(new google.maps.LatLng($("#top_left_lat").val(),$("#top_left_lng").val()));
			widgets.top_left_marker.setMap(map);
		break;
		case 3:
			showGrid();	
		break;



	}

}

function clear_tab(previous_tab){
	switch(previous_tab){
		case 0:
			hideTasks();	
		break;
		case 1:
			hideDropOffZone();
		break;
		case 2: 
			widgets.top_left_marker.setMap(null);
		break;
		case 3:
			clearGrid();	
		break;

	}

}
function showGrid(){
	if (widgets.grid != null) clearGrid();
	widgets.grid = [];
	var origin = new google.maps.LatLng($("#top_left_lat").val(),$("#top_left_lng").val());	
	var nw = origin; 

	for (var i=0; i<50; i++) {
		for (var j=0; j<51; j++){
			var bs = mapUtility.makebounds(nw,8,8);
			widgets.grid.push(new google.maps.Rectangle({bounds:bs,map:map}));	
			//southeast of previous northwest of the nextgrid
			nw = bs.getNorthEast();
		}
	        nw = google.maps.geometry.spherical.computeOffset(
				origin, 8*(i+1), 180
	        );
	}
}
function clearGrid(){
	if(widgets.grid == null) return;
	$.each(widgets.grid,function(index,value){
		value.setMap(null);	
	});
	widgets.grid=null;
}
 function showDropOffZone(){
}

function hideDropOffZone(){
}

function showTasks(){
}

function hideTasks(){
}

$(function(){
	//initialize tab wedget
	$("#editor-tabs" ).tabs({
		activate:function(event,ui){
				var newIndex = ui.newTab.index();
				var oldIndex = ui.oldTab.index();
				switch_tab(newIndex);
				clear_tab(oldIndex);
			}

	}); 
	$("#move-to-location").click(function(){
		map.setCenter(new google.maps.LatLng(
			$("#top_left_lat").val(),
			$("#top_left_lng").val()
		));

	});
	$("#set-location").click(function(){
		alert("coding is cool");
	});
});
