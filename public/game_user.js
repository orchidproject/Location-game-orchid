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

var players = [];
var boxes = [];
var tasks = [];

var lastGeigerPlayTime = 0;
var player_profiles = [];

var log="";
function saveLog(data){
    log=log+JSON.stringify(data)+"\n";
    
}



var latestMsgId = 0;

function receiveMessageData(data) {
	alert(data.player_name + ": " + data.content);
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

function receivePlayerInfoData(data){
	if(data.status=="incapacitated"){
		//setIcon to dead ppl
		if(players[data.id]==null){
			//alert("error occur");
		}
		else{
			var markerIcon = getPlayerIcon(data.initials,"dead");
			players[data.id].marker.setIcon(markerIcon);
		}
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

function clearAll(){
	for (i in players){
		players[i].marker.setMap(null);
		delete player[i];
	}
	for (i in tasks){
		tasks[i].marker.setMap(null);
		delete tasks[i];
	}

}

var UNLOAD_TARGET=-1;
var chosen_target=null;
function handleTaskStatus(task){
	//alert(task.type);
	//"1,2,3"
	var picked_up=false;
	var p=task.players.split(",");
	
	
	var handled = false;
	for (index in p){
		var id=p[index];
		
		
		if(id==$("#user_id").val()){
			//alert("status bar updated");
			chosen_target=task;
			update_status_bar(p,task.type);
			handled=true;
			break;
		}
	}
	
	//if task not handled, but prevously added to status bar, then clear it
	if((chosen_target!=null)&&!handled&&(chosen_target.id==task.id)){
		
		clear_status_bar();
	}
	
}


function system(data){
    
    if (data=="start"){
        //window.location="myapp://app_action/start";
        //location.reload();
       alert('game start');
    }
    //js will try to communicate with naive code
    else if(data=="end"){
    	alert('game end, please return to base');
       
    }
    else if(data=="reset"){
        
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


