
// This function is run by the iPhone or Android app, which pass an
// object to the function. The object will have come from either
// Geoloqi with the location of someone in the game, or from the game
// server with data about the coins on the map.
var times=0;
function LQHandlePushData(data) {

	// Location broadcasts from the group will have a user_id key
	if(typeof data.user_id != "undefined"){

		receivePlayerLocation({
			id: data.user_id,
			username: data.username,
			latitude: data.latitude,
			longitude: data.longitude
		});
	
	// Custom push data from mapattack will contain the "mapattack" key
	} else if(typeof data.mapattack != "undefined") {
		var push = data.mapattack;
//		if(typeof push.place_id != "undefined"){
//			receiveCoinData(data.mapattack);
//			if(push.triggered_user_id == $("#user_id").val()) {
//				$("#player-info").addClass("blink");
//				$("#player-info .message").html(push.points+" points!");
//				setTimeout(function(){
//					$("#player-info").removeClass("blink");
//					$("#player-info .message").html("");
//				}, 1200);
//			}
//        }
		if(typeof push.gamestate != "undefined" && push.gamestate == "done") {
			window.location = "/game/"+$("#layer_id").val()+"/complete";
		}
		if(typeof push.scores != "undefined") {
			for(var i in push.scores) {
				if(i == $("#user_id").val()) {
					$("#player-score .value").html($("#user_initials").val() + ": " + push.scores[i]);
				}
			}
		}
	} else if(typeof data.reading != "undefined"){
        receiveReadingData(data.reading);
        if(typeof data.reading.triggered_user_id  != "undefined"){
            
        }
    }
}

function system(data){
    
    if (data=="start"){
        window.location="myapp://app_action/start";
        location.reload();
    }
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

var socket;
$(document).ready(function() {
    updateGame(true);
	socket = io.connect('http://localhost:4567', {
            transports: ['websocket', 'flashsocket', 'htmlfile']
    });
    socket.on('game', function(data) {
        //debug
        //alert("join " + $("#group_token").val());
		socket.emit('game-join', $("#group_token").val());
	});
    
	socket.on('data', function(data) {
        data=filter(data);
        saveLog(data);


        if(typeof data.system != "undefined"){
            system(data.system);
        }
                
		if(typeof data.player != "undefined"){
            receivePlayerData(data.player);
        }
        
        if(typeof data.location != "undefined"){
            receiveLocationData(data.location);
        }

        if(typeof data.box != "undefined") {
        	receiveBoxData(data.box);
        }
        
        if(typeof data.task != "undefined") {
        	receiveTaskData(data.box);
        }
        
        if(typeof data.message != "undefined") {
        	receiveMessageData(data.box);
        }
        
        if(typeof data.health != "undefined") {
        	receiveHealthData(data.box);
        }
        
        if(typeof data.exposure != "undefined") {
        	receiveExposureData(data.exposure);
        }
        
//      if(typeof data.textMassage != "undefined"){
//      receiveTextMassage(data.textMassage);
//  }
  

//        if(typeof data.request != "undefined"){
//            receiveRequestData(data.request);
//        }
//        
//        if(typeof data.reading != "undefined"){
//            receiveReadingData(data.reading);
//        }
//            
//        if(typeof data.cargo != "undefined"){
//                receiveCargoData(data.cargo);
//        }
			
		       
        
	});

    //window.location="myapp://app_action/joined?"+$("#user_id").val()+"&"+$("#user_team").val();
    //to do 
    //$("#player-score .value").html($("#user_initials").val());
    
});


function locationUpdate(userID, latitude, longitude){
    socket.emit('location-push',{ player_id:userID,latitude:latitude,longitude:longitude});
}

