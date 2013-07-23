
$(function(){
	if(test){

		$("#btn-setframe").click(function(){
		
			if(isNaN($("#txt-frame").val())){
				alert("frame not a number");
			}else{ 
				$.get("/test/" + GAME_ID+ "/" + $("#txt-frame").val()  + "/getFrame",
				function(data){
					receiveHeatmapData(JSON.parse(data));
				}
			); } 
		});
	}else{
		$("#btn-setframe").hide();
		$("#txt-frame").hide(); 
	}

	$("#btn-fetchplan").click(function(){
		if(isNaN($("#txt-frame").val())){
				alert("frame not a number");
				return;
		}
		
		$("#btn-fetchplan").attr("value","fetching");
		$("#btn-fetchplan").attr("disabled","true");
		//construct rejections data
		
		var rejects = []//getRejections();
		$.post("/test/" + GAME_ID + "/" +  $("#txt-frame").val() + "/fetchplan",
			{"rejections": JSON.stringify(rejects)},		
			function(data){
				alert("data sent: " + JSON.stringify(data.sent));		
				alert("received plan: "+JSON.stringify(data.plan));		
				if(data.plan.plan!=null){
					//plan is an array if multiple steps are specified
					//receiveInstructionData(data.plan.plan[0]); 
				}
				
				$("#btn-fetchplan").attr("value","fetchplan");
				$("#btn-fetchplan").removeAttr("disabled");
			}				
			,"json"
		);

	});


	
}); 

function setupTest(pid){
	google.maps.event.addListener(players[pid].marker, "dragend", 
				function(event) {
				var lat = event.latLng.lat();
				var lng = event.latLng.lng();
				players[pid].marker.setIcon(getPlayerIcon("00","dead"));	
				socket.emit("location-push", 
				{  
			
					  player_id: players[pid].id,
					  latitude:lat, 
					  longitude:lng, 
					  skill: players[pid].skill, 
					  initials: players[pid].initials
		 
				});
					
				return false;
				//alert(JSON.stringify(event));

			});

}



function setupTaskTest(task){
	google.maps.event.addListener(task.marker, "dragend", 
		function(event) {
			var lat = event.latLng.lat();
			var lng = event.latLng.lng();
			task.marker.setIcon(getPlayerIcon("xx","dead"));	
			$.post("/test/" + GAME_ID + "/updateTask",
				{"lat":lat, "lng":lng, "id":task.id},
				function(data){
					alert("data sent: " + JSON.stringify(data.sent));
					alert("result: "+JSON.stringify(data.result));
				},
				"json");
			  
	});

	
}

function getRejections(){
	var r =  [];
	$(rejections).each(function(index,value){
		if(value!=null&&value&&players[index]!=null&&players[index].instruction!=null){
			instruction = players[index].instruction;
			r.push({player:instruction.id , task:instruction.task , duration: 1});	
		}
	});
	return r;
}

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

