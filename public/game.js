var SOCKET_IO_ADDRESS = 'http://localhost:49991';
var NODE_JS_ADDRESS = 'http://localhost:8080';



var setup = false;

var GameMap = {
	fitToRadius: function(radius) {
	  var center = map.getCenter();
	  var topMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 0);
	  var bottomMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 180);
	  var bounds = new google.maps.LatLngBounds();
	  bounds.extend(topMiddle);
	  bounds.extend(bottomMiddle);
	  map.fitBounds(bounds);
	}
}

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

var coinSpriteURL = "/img/gameboard-sprite.png";
var coinHeight = 25;
var coins = {
	10: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17),  cg.p(0, 277), cg.p(17/2, 17/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17), cg.p(0, 302), cg.p(17/2, 17/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(17,17), cg.p(0, 327), cg.p(17/2, 17/2))
	},
	20: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19),  cg.p(17, 276), cg.p(19/2, 19/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19), cg.p(17, 301), cg.p(19/2, 19/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(19,19), cg.p(17, 326), cg.p(19/2, 19/2))
	},
	30: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21),  cg.p(36, 275), cg.p(21/2, 21/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21), cg.p(36, 299), cg.p(21/2, 21/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(21,21), cg.p(36, 325), cg.p(21/2, 21/2))
	},
	50: {
		red: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25),  cg.p(57, 273), cg.p(25/2, 25/2)),
		blue: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25), cg.p(57, 298), cg.p(25/2, 25/2)),
		grey: new google.maps.MarkerImage(coinSpriteURL, cg.s(25,25), cg.p(57, 323), cg.p(25/2, 25/2))
	}
};
var truckImageURL = "/img/truck.png";
var truckIcon= new google.maps.MarkerImage(truckImageURL, playerIconSize, playerIconOrigin, playerIconAnchor);
var pollutantImageURL = "/img/skull.png";
var pollutantIcon= new google.maps.MarkerImage(pollutantImageURL, playerIconSize, playerIconOrigin, playerIconAnchor);
var pollutantImageURL_exposed = "/img/skull-exposed.png";
var pollutantIcon_exposed = new google.maps.MarkerImage(pollutantImageURL_exposed, playerIconSize, playerIconOrigin, playerIconAnchor);

var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor),
	red: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor)
}


var requests = [];
var players = [];
var boxes = [];
var tasks = [];



//var readings = [];
//var cargos = [];



var truckMarker;


var people = [];
var player_profiles = [];
// player icon: '/player/' + player.geoloqi_id + "/" + player.team + '/map_icon.png'


function deleteCoin(id) {
	$(pellets).each(function(i, pellet) {
		if(pellet.id == id) {
			pellet.marker.setMap(null);
		}
	});
}

var infowindow = new google.maps.InfoWindow({
        content: ""
    });

function receiveReadingData(data) {
    
    
	var icon=cg.playerImage(data.value, 'blue');
    
    
	if(typeof readings[data.player_id] == "undefined") {
        
		readings[data.player_id] = {
			id: data.id,
            player_id : data.player_id,
            value: data.value,
			marker: new google.maps.Marker({
				position: new google.maps.LatLng(data.latitude, data.longitude),
				map: map,
				icon: icon,
                clickable:true
			
            })
		};
        infowindow.setContent("<h5> reported by "+players[data.player_id].name+"</h5><br><h5> value: "+data.value+"</h5><br>");
        
        google.maps.event.addListener(readings[data.player_id].marker, 'click', function() {
            
            infowindow.open(map,readings[data.player_id].marker);
        });
	} else {
		// one user have one readings displayed
		var p = readings[data.player_id];
		if(true) {
            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
            p.marker.setIcon(icon);
        } else {
			console.debug("coin already claimed");
		}
        infowindow.setContent("<h5> reported by "+players[data.player_id].name+"</h5><br><h5> value: "+data.value+"</h5><br>");
        google.maps.event.addListener(p.marker, 'click', function() {
           
            infowindow.open(map,p.marker);
        });
	}
    
    
}

var log="";
function saveLog(data){
    log=log+JSON.stringify(data)+"\n";
    
}

function receiveRequestData(data) {
    
    
	markerIcon = coins[10].grey;
	if(typeof requests[data.id] == "undefined") {
		requests[data.id] = {
			id: data.id,
            radius: data.radius,
			marker: new google.maps.Marker({
				position: new google.maps.LatLng(data.latitude, data.longitude),
				map: map,
				icon: markerIcon
			})
		};
	} else {
		// Coin is already on the screen, decide whether we should update it
		var p = requests[data.id];
		if(true) {
			p.marker.setMap(null);
			p.marker = new google.maps.Marker({
				position: new google.maps.LatLng(data.latitude, data.longitude),
				map: map,
				icon: markerIcon
			});
		} else {
			console.debug("coin already claimed");
		}
	}
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

function receiveTaskData(data) {
	//schema: task { id: integer , player_id: [ array of integer ] , latitude: float , longitude: float, description: string, completed: boolean }

	//first step: push the task to the comms list (as long as this task is meant for us)
	if(data.player_id.contains($('#user_id').val())) {
		pushToTaskHistory(data.description, "task" + data.id);
	}	
	
    var markerIcon;
	var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
    markerIcon = taskIcon;
    	    
    if(typeof tasks[data.id] == "undefined") {
        
        tasks[data.id] = {
            id: data.id,
            marker: new google.maps.Marker({
                position: new google.maps.LatLng(data.latitude, data.longitude),
                map: map,
                icon: markerIcon,
                visible: !data.completed
            })
        };
    } else {
        //update 
        var p = tasks[data.id];
            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
            p.marker.setVisible(!data.completed);
            p.marker.setIcon(markerIcon);
    }
        
}

function receiveMessageData(data) {
	//schema: message { id: integer , player_id: [ array of integer ] , content: string }

	//push the task to the comms list (as long as this task is meant for us)
	if(data.player_id.contains($('#user_id').val())) {
		pushToTaskHistory(data.content, "msg" + data.id);
	}
        
}

function receiveHealthData(data) {
	//schema: health { player_id : integer , value : integer }

	//push the task to the comms list (as long as this task is meant for us)
	if(data.player_id == $('#user_id').val()) {
		//TODO: need to update health image/indicator HTML element
		var health = data.value;
	}
        
}


function receiveExposureData(data) {
	//schema: health { player_id : integer , value : integer }

	//push the task to the comms list (as long as this task is meant for us)
	if(data.player_id == $('#user_id').val()) {
		//TODO: need to update exposure image/indicator HTML element
		var exposure = data.value;
	}
        
}




//function receiveCargoData(data) {
//    var markerIcon;
//	var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
//    if(data.exposed) {
//        markerIcon = pollutantIcon_exposed;
//    }
//    else{
//        markerIcon = pollutantIcon;
//    }
//    
//    
//    //visible to truck anyway
//    if ( $("#user_team").val() == "truck" ){
//        data.exposed=true;
//    }
//	    
//    if(typeof cargos[data.id] == "undefined") {
//        
//        cargos[data.id] = {
//            id: data.id,
//            value: data.value,
//            radius: data.radius,
//            marker: new google.maps.Marker({
//                position: new google.maps.LatLng(data.latitude, data.longitude),
//                map: map,
//                icon: markerIcon,
//                visible: data.exposed
//            })
//        };
//    } else {
//        //update 
//        var p = cargos[data.id];
//            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
//            p.radius = data.radius;
//            p.marker.setVisible(data.exposed);
//            p.marker.setIcon(markerIcon);
//    }
//        
//}


function receivePlayerData(data) {
   
	    var markerIcon;
		var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
	    if(data.skill == 'A') {
	    	markerIcon = personSkillA;
	    }
	    if(data.skill == 'B') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    if(data.skill == 'C') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    if(data.skill == 'D') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    	    
	    if(typeof players[data.id] == "undefined") {
	        
	        players[data.id] = {
	            id: data.id,
	            name: data.name,
	            marker: new google.maps.Marker({
	                position: new google.maps.LatLng(data.latitude, data.longitude),
	                map: map,
	                icon: markerIcon,
	                visible: true
	            })
	        };
	    } else {
	        //update 
	        var p = players[data.id];
	            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
	            p.marker.setIcon(markerIcon);
	    }	        
	
//        if(typeof players[data.id] == "undefined") {
//        
//            players[data.id] = {
//                id: data.id,
//                name: data.name,
//                team: data.team,
//                points_cache: data.points_cache
//            };
//        } else {
//            var p = players[data.id];
//            p.team = data.team;
//            p.points_cache = data.points_cache;
//        }
   
}



//add markers to player's array 
function receiveLocationData(data) {

	var id = data.player_id;
	var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
	var exists;
	if(typeof players[data.player_id] == "undefined"){
		

	
    }else{
			var player = players[data.player_id];
            if(player.team == "runner"){
                markerIcon=cg.playerImage(player.name, 'red');
            }
            else if(player.team == "truck"){
                markerIcon=truckIcon;
            }
            
            if(typeof player.marker == "undefined"){
            
                player.marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    icon: markerIcon
                });
                
                if(player.team == "truck"){
                    truckMarker = player.marker;
                }
                
            }
            else{
                player.marker.setPosition(myLatLng);
            }
		
	}

}

function errorCheck(data){
    if (typeof data.error != 'undefined'){
        alert(data.error);
    }
}

function receiveTextMassage(data){
    alert(data.content);
}

function cleanup(data){
    if (typeof data.player != "undefined"){
        $(data.player).each(function(i,id){
            var p=players[id];
            if(p!=null){
                p.marker.setMap(null);
                if (p.team=="controller"){
                    $(requests).each(function(i,r){
                        r.marker.setMap(null);
                    });
                }
                else if (p.team == "truck"){
                    $(cargos).each(function(i,c){
                        c.marker.setMap(null);
                    });
                }
                else if (p.team == "runner"){
                    reading[id].setMap(null);
                }
            }
        });
    }
    if (typeof data.request != "undefined"){
        $(data.request).each(function(i,id){
            if(requests[id] != null){
                requests[id].marker.setMap(null);
            }
        });
    
    }
    if (typeof data.cargo != "undefined"){
        $(data.cargo).each(function(i,id){
            if(cargos[id] != null){
                cargos[id].marker.setMap(null);
            }
        });
    }
    
    if (typeof data.reading != "undefined"){
        $(data.reading).each(function(i,id){
            if(readings[id] != null){
                readings[id].marker.setMap(null);
            }
        });
    }

}

                    


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

function endGame(){


}


function pushToTaskHistory(message, identifier) {
	//pushes the string message to the task list (including the date time added)
	//(called when new tasks and messages are received)
		
	var line = $("<li id='" + identifier + "'>" + message + "</li>"); //TODO: add date, intended recipients
	var taskList = $('#task_list');
	taskList.append(line);
	taskList.listview( "refresh" );  
}

// Load the initial game state and place the pins on the map. Sample data in pellets.json
// This function polls the game server for data.
function updateGame(oneTime) {
	$.ajax({ 
		url: "/game/"+$("#layer_id").val()+"/status.json",
		type: "GET",
		data: {after: lastRequestTime},
		dataType: "json", 
		success: function(data) {
			$("#num-players").html(data.player.length + " Players");
			
            
			$(data.player).each(function(i, player){
                var d=filter({"player":player});
                if(typeof d.player != "undefined"){
                    receivePlayerData(d.player);
                }
            });
            
            $(data.location).each(function(i, location){
                var d=filter({"location":location});
                if(typeof d.location != "undefined"){
                    receiveLocationData(d.location);
                }
            });
            
			$(data.request).each(function(i, request) {
                var d=filter({"request":request});
                if(typeof data.request != "undefined"){
                    receiveRequestData(d.request);
                }
			});
            
            $(data.reading).each(function(i, reading){
               var d=filter({"reading":reading});
               if(typeof d.reading != "undefined"){
                receiveReadingData(d.reading);
               }
            });
            
    
            $(data.cargo).each(function(i, po){
                var d=filter({"cargo":po});
                if(typeof d.cargo != "undefined"){
                    receiveCargoData(d.cargo);
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

//hello