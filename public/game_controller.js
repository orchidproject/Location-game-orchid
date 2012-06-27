

var pollutantImageURL = "/img/skull.png";
var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);	

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

var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor),
	red: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor)
}

var taskIcon = playerIcons['blue']; 
var personSkillA = playerIcons['red'];
var players = [];
var boxes = [];


var lastGeigerPlayTime = 0;



//new heatmap drawing//
//var backGroundRec;
var heat_map=[];
function receiveHeatmapData(data){
    var i=0;
    for (i=0; i<data.length; i++){
       if(heat_map[data[i].index]==null){
       		if (data[i].value>0){
       			var point=new google.maps.LatLng(data[i].lat, data[i].lng);
       			heat_map[data[i].index]=new google.maps.Circle(pick_overlay( data[i].value, point))
       		}
       }
       else{
       		var point=new google.maps.LatLng(data[i].lat, data[i].lng);
       		heat_map[data[i].index].setOptions(pick_overlay( data[i].value, point));
       }
    }
	
}

var HEAT_MAP_COLORS = ["#202020","#3B3B3B","#3B3D64","#3F3CAD","#4B85F3","#3CBDC3","#56D355","#FFFB3D","#FF9F48","#FD3B3B","#FD3B3B"];
function pick_overlay(value, point){
		var circleOptions = {
        		strokeColor: HEAT_MAP_COLORS[value],
        		strokeOpacity: 0.8,
        		strokeWeight: 0,
        		fillColor: HEAT_MAP_COLORS[value],
        		fillOpacity: 0.35,
        		map: map,
        		center: point,
                clickable:false,
        		radius: 5//0.5*5.71
        };
    return circleOptions;

}

//////old heatmap drawing//////
/*
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
            clickable: false,
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
        delete cell;
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
*/

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







function errorCheck(data){
    if (typeof data.error != 'undefined'){
        alert(data.error);
    }
}

function receiveTextMassage(data){
    alert(data.content);
}

function receivePlayerInfoData(data){

	if(data.status=="incapacitated"){
		//setIcon to dead ppl
		if(players[data.player_id]==null){
			alert("error occur");
		}
		else{
			var markerIcon = getPlayerIcon(data.initials,"dead");
			players[data.player_id].marker=markerIcon;
		}
	}
	else{
		$("#players").append("<tr><td align='center'>"+ data.name +"</td> <td align='center'>"+ data.skill +"</td> <td align='center'><div id='exposure_"+data.id+"'></div> </td> <td align='center'> <div id='level_"+data.id+"'></div> </td><tr>");
	}
}



function receiveExposureData(data){
    document.getElementById("exposure_"+data.player_id).innerHTML=data.value;
    
    var level = document.getElementById("level_"+data.player_id);
    if (data.value <= 50) {
    	level.innerHTML = "Low"; 
    }
    else if (data.value > 50 && data.level <=350)   {
    	level.innerHTML = "Increased"; 
    }
    else if (data.value > 350 && data.level <=750)   {
    	level.innerHTML = "High"; 
    }
    else if (data.value > 750 && data.level <=999)   {
    	level.innerHTML = "Critical"; 
    }
    else if (data.value >= 1000)   {
    	level.innerHTML = "Incapacitated"; 
    }
}

////legacy but probably useful
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
    
    if($("#user_team").val()=="controller"){                
        delete data.radiation
    }
    
    
    return data

}

function system(data){
    
    if (data=="start"){
        location.reload();
        //need to clear all previous data
    }
    //legacy for iOS, this part will try to communicate with iphone native code
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
        
        
        location.reload();
    }
    else if(data=="reset"){
        location.reload();
        //need to clear all previous data
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
			
            $(data.task).each(function(i, task){
                var d=filter({"task":task});
                if(typeof d.task != "undefined"){
                    receiveTaskData(d.task);
                }
            });
                        
            $(data.location).each(function(i, location){
                var d=filter({"location":location});
                if(typeof d.location != "undefined"){
                    receivePlayerData(d.location);
                }
            });
            
             $(data.player).each(function(i, player){
                var d=filter({"player":player});
                if(typeof d.player != "undefined"){
                    receivePlayerInfoData(d.player);
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
