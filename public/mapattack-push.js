
// This function is run by the iPhone or Android app, which pass an
// object to the function. The object will have come from either
// Geoloqi with the location of someone in the game, or from the game
// server with data about the coins on the map.
var times=0;

function joinGame(team) {
    $.ajax({ 
		url: "/game/"+$("#layer_id").val()+"/webjoin",
		type: "GET",
		data: {"team": team},
		dataType: "json", 
		success: function(data) {
            if (typeof data.error != 'undefined'){
                alert(data.error);
            }
            else{
                location.reload();
            }
                   
        }
        
    });
}

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
	socket = io.connect(  'http://holt.mrl.nott.ac.uk:49991', { //'http://localhost:4567', { //
            transports: ['xhr-polling', 'xhr-multipart', 'websocket', 'flashsocket', 'htmlfile']
    });
    socket.on('game', function(data) {
        //debug
        //alert("join " + $("#group_token").val());
		socket.emit('game-join', $("#group_token").val());
	});
    
	socket.on('data', function(data) {
		//alert('socket io received: ' + data);
//		$('#headline_message').text(data);
//		
//        data=filter(data);
        saveLog(data);

//uncomment to debug in browser on computer
        handleSocketData(data);

        
	});

    //window.location="myapp://app_action/joined?"+$("#user_id").val()+"&"+$("#user_team").val();
    //to do 
    //$("#player-score .value").html($("#user_initials").val());
    
});




function locationUpdate(userID, latitude, longitude){
    socket.emit('location-push',{ player_id:userID,latitude:latitude,longitude:longitude});
}

