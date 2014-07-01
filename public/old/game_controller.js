var pollutantImageURL = "/img/skull.png";
var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);	

var setup = false;

var lastRequestTime = 0;

var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor),
	red: new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor)
}

var ROLE_MAPPING = ["medic","firefighter","soldier","transporter","plane"];

var taskIcon = playerIcons['blue']; 
var personSkillA = playerIcons['red'];
var players = [];
var boxes = [];
var intructions = [];

var lastGeigerPlayTime = 0;
//used for test only
var rejections =[];


//------------------------------------------HeatMapDrawing-----------------------------------
var HCount = 0;

var hUpdateReadings = function(data,indexing,hmData){
	var i=0;
    for (i=0; i<data.length; i++){
       if(indexing[data[i].index]==null){
       		if (data[i].value>0){
				var point=new google.maps.LatLng(data[i].lat, data[i].lng);
				hmData.push({
					index: data[i].index,
					location: point,
					weight: parseFloat(data[i].value),
					count:HCount
				});	
				//remember the index
				indexing[data[i].index] = hmData.length-1;	
       		}
       }
       else{
			hmData[indexing[data[i].index]].weight = parseFloat(data[i].value);
			hmData[indexing[data[i].index]].count = HCount; 
       }
    }   
    HCount++;
}


//-------------------------- m1 ---------------------------
var cHeatMapIndexing={};
var cHeatMapData = [];
var cHeatMap = null;

//var backGroundRec;
var heatMapIndexing={};
var heatMapData = [];
var heatMap=null ; 

var hBuffer = [];

 
function hFilterOverlapData(o1,o2,i2){
	hBuffer = [];
	hBuffer = hBuffer.concat(o2);
	var dup = [];
	for (i=0; i<o1.length; i++){
		for (j=0; j<hBuffer.length; j++){
			if(o1[i].index == hBuffer[j].index){
				dup.push(hBuffer[j]);
			}
		}
	}

	//delete duplication
	for (i=0; i<dup.length; i++){
		hBuffer.splice(hBuffer.indexOf(dup[i]),1);
		//delete i2[dup[i].index];
	}
}

function drawOldHmap(){
	if(heatMap != null){
		heatMap.setMap(null); 
    }

 	var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  	]
    heatMap = new google.maps.visualization.HeatmapLayer({
	    data: hBuffer, 
	    opacity: 0.5,
	    radius: 20,
	    gradient: gradient
    });
	
    heatMap.setMap(map);
}

function drawNewHmap(){
	if(cHeatMap != null){
		cHeatMap.setMap(null); 
    }

    cHeatMap = new google.maps.visualization.HeatmapLayer({
	    data: cHeatMapData, 
	    opacity: 0.7,
	    radius: 20 
    });
	
    cHeatMap.setMap(map);	
}



function receiveHeatmapDataV2(data){
	hUpdateReadings(data,heatMapIndexing,heatMapData);
    hUpdateReadings(data,cHeatMapIndexing,cHeatMapData);
    hFilterOverlapData(cHeatMapData,heatMapData,heatMapIndexing);

    drawOldHmap();
    drawNewHmap();

    //clear data
    cHeatMapIndexing=[];
	cHeatMapData = [];
}


//----------------------------------------Old Heatmap drawing --------------------------- 
var heat_map = [];
function receiveHeatmapData(data){
    var i=0;
    for (i=0; i<data.length; i++){
       if(heat_map[data[i].index]==null){
       		if (data[i].value>0){
			var point=new google.maps.LatLng(data[i].lat, data[i].lng);
			heatMapData.push({
				location: point,
				weight: parseFloat(data[i].value)
			});	
			//remember the index
			heat_map[data[i].index] = heatMapData.length-1;	
       		}
       }
       else{
		heatMapData[heat_map[data[i].index]].weight= parseFloat(data[i].value);
       }
    }

    if(heatMap != null){
	heatMap.setMap(null); 
    }

    heatMap = new google.maps.visualization.HeatmapLayer({
	    data: heatMapData, 
	    radius: 20 
    });

    heatMap.setMap(map);
}
//-------------------------------------------------------------------------


//---------------------------------m2
/*

var cHeatMapIndexing={};
var cHeatMapData = [];
var heatMaps = [];


var hDivide =function(data,n){
	var datasets = [];
	for(i=HCount; i> HCount-n; i--){
		if(i>=0){
			var frame = [];
			$(data).each(function(index,value){
				if(value.count==i){
					frame.push(value);
				}
			});
			datasets.push(frame);
		}
	}
	return datasets;
}

var clearHeatMaps = function(){
	$(heatMaps).each(function(i,v){
		v.setMap(null);
	})
	heatMaps = [];
}

var hDrawHeatMap = function(data,opacity){

	var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  	]
    var hm = new google.maps.visualization.HeatmapLayer({
	    data: data, 
	    opacity: opacity,
	    radius: 20,
	    gradient: gradient
    });
	
    hm.setMap(map);
    return hm;
}

var receiveHeatmapData = function(data){
	hUpdateReadings(data,cHeatMapIndexing,cHeatMapData);
	var datasets = hDivide(cHeatMapData,5);
	clearHeatMaps();
	$(datasets).each(function(index,value){
		var hm = hDrawHeatMap(value,0.8-index*0.1);
		heatMaps.push(hm);
	});

}
*/
//----------------------------------------HeatMap end -----------------------------------

var log="";
function saveLog(data){
    log=log+JSON.stringify(data)+"\n";
    
}

function errorCheck(data){
    if (typeof data.error != 'undefined'){
        alert(data.error);
    }
}

function receiveTextMassage(data){
    alert(data.content);
}

var panel_item=[];
var off_set = -1;

var previous_path=null;
var previous_teammate_path=null;

function receivePlayerInfoData(data){

	if(data.status=="incapacitated"){
		//setIcon to dead ppl
		if(players[data.id]==null){
			//alert("error occur"); 
		} else{
			var markerIcon = getPlayerIcon(data.initials,"dead");
			players[data.id].marker.setIcon(markerIcon);
			return;
		}
	}

	if(panel_item[data.id]==null){
		panel_item[data.id]= data;
		var image_url = cg.imageSrc(data.initials,data.skill);
		var image = "<img id='player-icon-"+ data.id + "'  src = '" + image_url + "' >";	
		var icon ="<td align='center'>"+image+"("+ data.initials +")</td>";
		var health = "<td align='center'><div id='health_"+data.id+"'></div> </td>";
		var level = "<td align='center'> <div id='level_"+data.id+"'></div> </td>";
		var button = "<td align = 'center'> <input id= 'view_btn_"+data.id+"' type='button' value='view' id='view_ins_"+data.id+"'/> </td>"
		var plan_button = "<td align = 'center'> <input id= 'plan_btn_"+data.id+"' type='button' value='accept' id='plan_"+data.id+"'/> </td>"
		var kick_button = "<td align = 'center'> <input id= 'kick_btn_"+data.id+"' type='button' value='kick' id='plan_"+data.id+"'/> </td>"

		if(test){
			$("#players").append("<tr id = 'panel_element_"+data.id+"'>" + 
				icon + 
				health + 
				level + 
				button + 
				plan_button + 
				kick_button +
			 "</tr>");

		}else{ 
			$("#players").append("<tr id = 'panel_element_"+data.id+"'>" + icon + health + level + button +  "</tr>");
		}


	}

	if(test){
		$("#player-icon-"+ data.id).click(function(){
			beginEdit(image_url,data);
		});
		rejections[data.id] = false;
		$("#plan_btn_"+ data.id).click(function(){
			if(!rejections[data.id]){ 
				rejections[data.id]= true;		
				//send io message
				if(players[data.id].instruction!=null){
					var instruction_id = players[data.id].instruction.id
					socket.emit("ack-instruction",{
						id: instruction_id, 
						status:3
					});
				}
			}
			else{ 
				rejections[data.id]= false;
				if(players[data.id].instruction!=null){
					var instruction_id = players[data.id].instruction.id
					socket.emit("ack-instruction",{
						id: instruction_id,
						status:2 });
					}
			}
		
			if(!rejections[data.id]){ 
				$("#plan_btn_"+ data.id).attr('value','accept');
			}
			else{ 
				$("#plan_btn_"+ data.id).attr('value','reject');
			}

		});

		$("#kick_btn_"+ data.id).click(function(){
			$.get('/game/'+GAME_ID+'/delete_player/' + data.id ,function(data) {
			});	
		});

	}


	


	$("#view_btn_"+data.id).click(function(){
		if( players[data.id].instruction == null){
			alert("no task assigned for this player");
			return;
		}

		if( players[data.id].instruction.task == -1){
			alert("no task assigned for this player");
			return;
		}
		var p = players[data.id];
		var lat = p.marker.getPosition().lat();	
		var lng = p.marker.getPosition().lng();
		var t = findTaskById(p.instruction.task);
		var lat2 = t.marker.getPosition().lat();	
		var lng2 = t.marker.getPosition().lng();	
		var flightPlanCoordinates = [
		      new google.maps.LatLng(lat, lng),
		      new google.maps.LatLng(lat2, lng2),
		  ];
		  var flightPath = new google.maps.Polyline({
		    path: flightPlanCoordinates,
		    strokeColor: '#FFFF00',
		    strokeOpacity: 1.0,
		    strokeWeight: 4 
		  });
		  if(previous_path!=null){
			previous_path.setMap(null);
		  } 
		  previous_path = flightPath;
		  flightPath.setMap(map);	
	
//draw teammate path	
		var teammate = null
		teammate = getTeammate(p.instruction);
		if(getTeammate(p.instruction) ==null){
			teammate = players[p.instruction.teammate];
		}
		lat = teammate.marker.getPosition().lat();		
		lng = teammate.marker.getPosition().lng();		
		flightPlanCoordinates = [
		      new google.maps.LatLng(lat, lng),
		      new google.maps.LatLng(lat2, lng2),
		  ];


		flightPath = new google.maps.Polyline({
		    path: flightPlanCoordinates,
		    strokeColor: '#FFFF00',
		    strokeOpacity: 1.0,
		    strokeWeight: 4 
		  });
		if(previous_teammate_path!=null){
			previous_teammate_path.setMap(null);
		} 
		previous_teammate_path = flightPath;
		flightPath.setMap(map);
	});	
	
}

function cleanup (player_id){
	//when receiving clean up message
	//delete player in array
	if( players[player_id] != null){
		players[player_id].marker.setMap(null);
	}
	players[player_id] = null;
	//delete player in view panel 
	var element = $("#panel_element_"+player_id);	
	element.remove();
}

function getTeammate(instruction){
	var t =  null;
	$(instruction.group).each(function(index,value){
		if(instruction.id != value){
			t =  value;
		}
	});	
	return players[t];
}

function findTaskById(task_id){
	var t =  null;
	$(tasks).each(function(index,value){
		if(task_id == value.id){
			t =  value;
		}
	});	
	return t;
}

function receiveHealthData(data){
   
    var health = $("#health_"+data.player_id).html(data.value); 
    var level = document.getElementById("level_"+data.player_id);
    if (data.value <= 25) {
    	level.innerHTML = "high"; 
    }
    else if (data.value > 25 && data.value <=50)   {
    	level.innerHTML = "medium"; 
    }
    else if (data.value > 50 && data.value <=75)   {
    	level.innerHTML = "low"; 
    }
    else if (data.value > 75 && data.value <100)   {
    	level.innerHTML = "minor"; 
    }
    else if (data.value == 100){
	level.innerHTML = "none";
    }
}



function receiveExposureData(data){
 }

function receiveInstructionData(data){

	//sameple:{"teammate":2,"task":117,"direction":"south east","status":1,"time":1372781334,"id":160,"player_id":6}
	$(data.players).each(function(index,value){
		if(players[value.id]!=null){
			players[value.id].instruction = value;
			if(value.task==-1){ 
				
			}
		}
	});

}

function receiveInstructionDataV2(data){

	//sameple:{"teammate":2,"task":117,"direction":"south east","status":1,"time":1372781334,"id":160,"player_id":6}
	
	if(players[data.player_id]!=null){
		players[data.player_id].instruction = data;
		if(data.task<0){ 
			$("#view_btn_"+data.player_id).val("no task");	
		}else{
			$("#view_btn_"+data.player_id).val("view");	
		}

	}

}
//for replay
function receiveInstructionDataV3(data){

	//sameple:{"teammate":2,"task":117,"direction":"south east","status":1,"time":1372781334,"id":160,"player_id":6}
		
	if(players[data.player_id]!=null){
		players[data.player_id].instruction = data;
		var p = players[data.player_id];
		var lat = p.marker.getPosition().lat();	
		var lng = p.marker.getPosition().lng();
		if(p.previous_path!=null){
			p.previous_path.setMap(null);
		} 
		if (data.task == -1){
			return;	
		}


		var t = findTaskById(p.instruction.task);
		var lat2 = t.marker.getPosition().lat();	
		var lng2 = t.marker.getPosition().lng();	
		var flightPlanCoordinates = [
		      new google.maps.LatLng(lat, lng),
		      new google.maps.LatLng(lat2, lng2),
		  ];
		  var flightPath = new google.maps.Polyline({
		    path: flightPlanCoordinates,
		    strokeColor: '#FFFF00',
		    strokeOpacity: 1.0,
		    strokeWeight: 4 
		  });

		  p.previous_path = flightPath;
		  flightPath.setMap(map);	
	
		
	}

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
            data: {"content":"hi", "player_id": $("#user_id").val()},
            dataType:"json",
            success: function(data) {
                           
            }
        });    
    }

}

function receiveMessageData(data) {
	if(data.target != null || data.target2 != null) return;
	pushToTaskHistory(data.content, "msg" + latestMsgId++, data.player_initials, data.player_id,data.player_skill);
	//alert(data.player_name + ": " + data.content);
}
var latestMsgId = 0;


function pushToTaskHistory(message, identifier, player_initials, player_id,player_skill) {
	//pushes the string message to the task list (including the date time added)
	//(called when new tasks and messages are received)
	
	var currentTime = new Date();
	var img = "";
	if(player_id!=-1){
		img = "<img src='" +cg.imageSrc(player_initials,player_skill)+ "'>";
	}
	else{
		img = "controller";	
	}

	var line = $("<li id='" + identifier + "'>"+img+" ("+player_initials+"): " + message + "  (sent " + currentTime.getHours() +":"+currentTime.getMinutes()+")</li>"); //TODO: add intended recipients
	var taskList = $('#chatbox');
	taskList.append(line);
	
	
	var newscrollHeight = $("#chatbox").attr("scrollHeight") - 20;
	$("#chatbox").animate({ scrollTop: newscrollHeight }, 'normal'); 
}

function handleTaskStatus(task){

	//empty implementation
};


