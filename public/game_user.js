var setup = false;


//duplication in game-common
/*var GameMap = {
	fitToRadius: function(radius) {
	  var center = map.getCenter();
	  var topMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 0);
	  var bottomMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 180);
	  var bounds = new google.maps.LatLngBounds();
	  bounds.extend(topMiddle);
	  bounds.extend(bottomMiddle);
	  map.fitBounds(bounds);
	}
}*/

var lastRequestTime = 0;

var cg = {
	s: function(w,h) {
		return new google.maps.Size(w,h);
	},
	p: function(w,h) {
		return new google.maps.Point(w,h);
	},
	playerImage: function(name, team) {
//		if(typeof name == "undefined") name = "AA";
//		if(typeof team == "undefined") team = "red";
		return new google.maps.MarkerImage("/player/"+name[0]+"/"+name[1]+"/"+team+"/map_icon.png", new google.maps.Size(38, 31), new google.maps.Point(0,0), new google.maps.Point(10, 30));
	}
}

var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor),
	red: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor)
}



var players = [];
var boxes = [];
var tasks = [];

var lastGeigerPlayTime = 0;
var player_profiles = [];
// player icon: '/player/' + player.geoloqi_id + "/" + player.team + '/map_icon.png'




var log="";
function saveLog(data){
    log=log+JSON.stringify(data)+"\n";
    
}



function receiveBoxData(data) {
    var markerIcon;
	var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
    if(data.removed) {
        markerIcon = boxIconRemoved;
    }
    else{
        markerIcon = boxIcon;
    }
    
    	    
    if(typeof boxes[data.id] == "undefined") {
        
        boxes[data.id] = {
            id: data.id,
            points: data.points,
            marker: new google.maps.Marker({
                position: new google.maps.LatLng(data.latitude, data.longitude),
                map: map,
                icon: markerIcon,
                visible: true
            })
        };
    } else {
        //update 
        var p = boxes[data.id];
            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
            //p.marker.setVisible(data.exposed);
            p.marker.setIcon(markerIcon);
    }
        
}



// function receiveTaskData(data) {
// 	//schema: task { id: integer , player_id: [ array of integer ] , latitude: float , longitude: float, description: string, completed: boolean }
// 
// 	//first step: push the task to the comms list (as long as this task is meant for us)
// 	if(data.player_id.contains($('#user_id').val())) {
// 		pushToTaskHistory(data.description, "task" + data.id);
// 	}	
// 	
// 	alert("A new task has arrived! Description: " + data.description);
// 	
//     var markerIcon;
// 	var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
//     markerIcon = taskIcon;
//     	    
//     if(typeof tasks[data.id] == "undefined") {
//         
//         tasks[data.id] = {
//             id: data.id,
//             marker: new google.maps.Marker({
//                 position: new google.maps.LatLng(data.latitude, data.longitude),
//                 map: map,
//                 icon: markerIcon,
//                 visible: !data.completed
//             })
//         };
//     } else {
//         //update 
//         var p = tasks[data.id];
//             p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
//             p.marker.setVisible(!data.completed);
//             p.marker.setIcon(markerIcon);
//     }
//         
// }


var latestMsgId = 0;

function receiveMessageData(data) {
	//schema: message { id: integer , player_id: [ array of integer ] , content: string }

	//push the task to the comms list (as long as this task is meant for us)
	//if(jQuery.inArray($('#user_id').val(), data.player_id)) {
		pushToTaskHistory(data.content, "msg" + latestMsgId++, data.player_initials, data.player_name);
		alert("Message from the controller: " + data.content);
	//}
        
}

function receiveHealthData(data) {
	//schema: health { player_id : integer , value : integer }

	//push the task to the comms list (as long as this task is meant for us)
	//alert('checking health: ' + data.player_id + ' against ' + $('#user_id').val());
	if(data.player_id == $('#user_id').val()) {
		//update health image/indicator HTML element
		var health = Number(data.value);
		$('#health_bar').progressbar({value:health});
	}
        
}


function receiveExposureData(data) {
	//schema: health { player_id : integer , value : integer }

	//push the task to the comms list (as long as this task is meant for us)
	if(data.player_id == $('#user_id').val()) {
		//TODO: need to update exposure image/indicator HTML element
		var exposure = data.value;
		setRadiation(exposure);
		var path = '/'; //'http://galax.me/media/sounds/';
		if(exposure < 30) {
			playSound('geiger_low.mp3', path);
		}
		if(exposure >= 30 && exposure < 80) {
			playSound('geiger_medium.mp3', path);
		}
		if(exposure > 80) {
			playSound('geiger_high.mp3', path);
		}
		//alert("new radation level: " + exposure);
	}
        
}

function playSound(filename, path) {
	//avoid playing sound repeatedly
	var currentTime = new Date().getTime();
	var loopDelay = 1000 * 100; //100 seconds delay between plays
	if(currentTime > lastGeigerPlayTime + loopDelay) {
		document.getElementById("geiger_sound").innerHTML="<embed src='"+path+filename+"' hidden=true autostart=true loop=false>";
		lastGeigerPlayTime = currentTime;
	}
	
}




function errorCheck(data){
    if (typeof data.error != 'undefined'){
        alert(data.error);
    }
}


///////////////////////heatmap drawing/////////////////
var backGroundRec;
var heat_map=[];


function receiveHeatmapData(data){
    //$(data.player).each(function(i,id)
    //var
    if (backGroundRec == null){
        var bound=new google.maps.LatLngBounds(
                                           new google.maps.LatLng(data[0][data[0].length-1].lat,data[0][data[0].length-1].lng),
                                           new google.maps.LatLng(data[data.length-1][0].lat,data[data.length-1][0].lng)
                                           
                                           );
    
        var options= {
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: "#FF0000",
            fillOpacity: 0,
            map: map,
            bounds:bound
        
        }
        backGroundRec=new google.maps.Rectangle();
        backGroundRec.setOptions(options);
    }
    
    $(heat_map).each(function(i,cell){
        cell.setMap(null);
        cell=null;
    });
    heat_map=[];
    
    var y=0;
    var x=0;
    for (y=0; y<data.length; y++){
        for (x=0; x<data[y].length; x++){
            
            var test=data[y][x];
            if (data[y][x].value>5.0){
                var point=new google.maps.LatLng(data[y][x].lat, data[y][x].lng);
                heat_map.push(new google.maps.Circle(pick_overlay( data[y][x].value, point)));
            }
        }
    }
    
}

function pick_overlay(reading_value, point){

    if (reading_value==100.0) {
        reading_value=99.9;
    } 
        
    var heat_map_colors = ["#202020","#3B3B3B","#3B3D64","#3F3CAD","#4B85F3","#3CBDC3","#56D355","#FFFB3D","#FF9F48","#FD3B3B"];
    
    var temp=heat_map_colors[Math.floor(reading_value/10)];

    var circleOptions = {
        		strokeColor: heat_map_colors[Math.floor(reading_value/10)],
        		strokeOpacity: 0.8,
        		strokeWeight: 0,
        		fillColor: heat_map_colors[Math.floor(reading_value/10)],
        		fillOpacity: 0.35,
        		map: map,
        		center: point,
                clickable:false,
        		radius: 5//0.5*5.71
        };
    return circleOptions;

}

var log="";
function saveLog(data){
    log=log+JSON.stringify(data)+"\n";
    
}


                    

//legacy but will be useful in future
function filter(data){

    if($("#user_team").val()=="truck"){
        if(typeof data.request != "undefined"){
            delete data.request
        }
         if(typeof data.reading != "undefined"){
            delete data.reading
        }
        
    }
    
    if($("#user_team").val()=="runner"){
         if(typeof data.location != "undefined"){
            if(players[data.location.player_id].team == "truck"){
                delete data.location
            }
        }
    }
    
    if($("#user_team").val()=="controller"){
         if(typeof data.location != "undefined"){
            if(players[data.location.player_id].team == "truck"){
                delete data.location
            }
        }
    }
    
    return data

}



function getTime() {
   var now = new Date();
   var outStr = pad(now.getHours(),1)+':'+pad(now.getMinutes(),1);
   return outStr;
}

function pad(num, size) {
	
	var extraZeros = size - Math.floor(Math.log(num) / Math.log(10));
	var i;
	for(i=0; i<extraZeros; i++) {
		num = '0' + num;
	}
	return num;
}

function pushToTaskHistory(message, identifier, player_initials, player_name) {
	//pushes the string message to the task list (including the date time added)
	//(called when new tasks and messages are received)
		
	var line = $("<li id='" + identifier + "'>"+player_name+" ("+player_initials+"): " + message + "  (sent " + getTime() + ")</li>"); //TODO: add intended recipients
	var taskList = $('#task_list');
	taskList.prepend(line);
	taskList.listview( "refresh" );  
}

// Load the initial game state
// This function polls the game server for data.
function updateGame(oneTime) {
	$.ajax({ 
		url: "/game/"+$("#layer_id").val()+"/status.json",
		type: "GET",
		data: {after: lastRequestTime},
		dataType: "json", 
		success: function(data) {
			$("#num-players").html(data.player.length + " Players");
			
            
//			$(data.player).each(function(i, player){
//                var d=filter({"player":player});
  //              if(typeof d.player != "undefined"){
    //                receivePlayerData(d.player);
      //          }
        //    });
            
            $(data.location).each(function(i, location){
                var d=filter({"location":location});
                if(typeof d.location != "undefined"){
                    receivePlayerData(d.location);
                }
            });
            
           
            $(data.task).each(function(i, task){
            	
                var d=filter({"task":task});
                if(typeof d.task != "undefined"){
                	
                    receiveTaskData(d.task);
                }
            });
            
            $(data.dropoffpoint).each(function(i, drop){
            	
                var d=filter({"drop":drop});
                if(typeof d.drop != "undefined"){
                	
                    receiveDropoffpointData(d.drop);
                }
            });
            
			            
			lastRequestTime = Math.round((new Date()).getTime() / 1000);
			if(!oneTime)
				setTimeout(updateGame, 5000);
			else
				setup = false;
		}
	});
}

function showScreen(screen) {
	var mapDiv = $('#map');
	var messageDiv = $('#messageListDiv');
	if(screen =='map') {
		mapDiv.show();
		messageDiv.hide();
	}
	if(screen =='messages') {
		mapDiv.hide();
		messageDiv.show();
	}
}

var test_msg_id = 0;
function testReceive(test) {
	if(test=='player') { //oregon ,
		var randomLatDelta = Math.random();
		var randomLngDelta = Math.random();
		var userId = Math.floor(Math.random()*11);
		var data = {'skill':'A', 'latitude':45.526675+randomLatDelta, 'longitude':-122.675428+randomLngDelta, 'id':userId, 'player_id':userId};
		receivePlayerData(data);
	}
	if(test=='health') { 
		var health = Math.floor(Math.random()*100);
		var data = {'player_id':'', 'value':health};
		receiveHealthData(data);
	}
	if(test=='exposure') { 
		var exposure = Math.floor(Math.random()*100);
		var data = {'player_id':'', 'value':exposure};
		receiveExposureData(data);
	}
	if(test=='message') { 
		var message = 'Here is a random number: '+Math.floor(Math.random()*100);
		var data = {'player_id':'', 'content':message, 'id':test_msg_id++};
		receiveMessageData(data);
	}
}

function system(data){
    
    if (data=="start"){
        window.location="myapp://app_action/start";
        location.reload();
    }
    //js will try to communicate with naive code
    else if(data=="end"){
        var results = "";
        
        $(players).each(function(i, player){
            if(typeof player != "undefined"){
                results=results+ player.name+ ":" + player.points_cache + "\n";
            }
        });
        alert(log);
        //push it back to server
         $.ajax({ 
            url: NODE_JS_ADDRESS+"/push_log",
            type: "POST",
            data: JSON.stringify({player_id:$("#user_id").val(),game_id:$("#layer_id").val(),data:log}),
            dataType:"json",
            success: function(data) {
                           
            }
        });    
        alert("Game ended\n Results: \n"+results);
        
        
        window.location="myapp://app_action/end"
        location.reload();
    }
    else if(data=="reset"){
        window.location="myapp://app_action/reset"
        
    }
    else if(data=="ready_check"){
        var ready=confirm("Ready check");
         $.ajax({ 
            url: "/player/ready_check",
            type: "GET",
            data: {"ready":ready, "id": $("#user_id").val()},
            dataType:"json",
            success: function(data) {
                           
            }
        });    
    }


}


