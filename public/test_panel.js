$(function(){


	$("#btn-setframe").click(function(){
		
		if(isNaN($("#txt-frame").val())){
			alert("frame not a number");
		//fetch frame 
		}else{ 
			$.get("/test/" + GAME_ID+ "/" + $("#txt-frame").val()  + "/getFrame",
				function(data){
					receiveHeatmapData(JSON.parse(data));
				}
			); 
		} 
	});
	$("#btn-fetchplan").click(function(){


	});
}); 

//alternative is a state model, could be mush better
var edit = function(event){
	var lat = event.latLng.lat();
	var lng = event.latLng.lng();		
	
	socket.emit("location-push", 
		{  
			
			  player_id: edit_player.id,
		          latitude:lat, 
			  longitude:lng, 
			  skill: edit_player.skill, 
			  initials: edit_player.initials
		 
		});
	stopEdit();
}

var listener;
var stopListener;
var edit_player; 
function beginEdit(cursor,data){
	//get Location from map push to server
	//do socketIO
	$('body').css('cursor', 'url('+ cursor+')');
	map.setOptions({ draggableCursor : 'url('+ cursor +')'});

	edit_player = data;
	listener = google.maps.event.addListener(map, "click", edit);
	stopListener = google.maps.event.addListener(map, "rightclick", stopEdit);

}

var stopEdit = function(){
	$('body').css('cursor', 'default');
	map.setOptions({ draggableCursor : 'default'});
	google.maps.event.removeListener(listener);	
	google.maps.event.removeListener(stopListener);	
}

