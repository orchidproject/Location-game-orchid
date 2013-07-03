var socket;
var game;	
function loadData(){
	game = new Game(layerId);
	game.loadData(function(data){
		$(data.getPlayers()).each(function(i,p){
			//translate to role id to role string
			p.skill = ROLE_MAPPING[p.skill]
			receivePlayerInfoData(p);
			p.player_id = p.id;
			receivePlayerData(p);
		});
		
		$(data.getTasks()).each(function(i,t){
			receiveTaskData(t);
		});

		$(data.getDropOffZones()).each(function(i,d){
			receiveDropoffpointData(d);	
		});

	}); 
}

$(document).ready(function() {
    loadData();
    
    socket = io.connect(SOCKET_IO_ADDRESS, {
            transports: ['websocket', 'flashsocket', 'htmlfile']
    });
    
    socket.on('game', function(data) {
        //debug
        //alert("join " + $("#group_token").val());
        //channel and id pair needed for hand shaking 
		socket.emit('game-join', {channel:$("#group_token").val()+"-1",id:-1});
		socket.emit('game-join', {channel:$("#group_token").val()+"-2",id:-1});
		socket.emit('game-join', {channel:$("#group_token").val(),id:-1});
	});
    
	socket.on('data', function(data) {
        saveLog(data);
        sendBackAck(data.ackid);
        
        
        if(typeof data.acc_exposure != "undefined"){
            receiveExposureData(data.acc_exposure);
        }
        
        if(typeof data.system != "undefined"){
            system(data.system); 
        }
              
        if(typeof data.heatmap != "undefined"){
              receiveHeatmapData(data.heatmap);
        }
        
        //not sure whether this is implemented
        if(typeof data.textMassage != "undefined"){
            receiveTextMassage(data.textMassage);
        }
        
        if(typeof data.message != "undefined") {
    		receiveMessageData(data.message);
    	}
        
        if(typeof data.location != "undefined"){
            receivePlayerData(data.location);
        }
        
        if(typeof data.cleanup != "undefined"){
                //cleanup(data.cleanup); not implemented now
        }
        
        if(typeof data.player != "undefined"){
                receivePlayerInfoData(data.player);
        }
        
        if(typeof data.task != "undefined"){
                receiveTaskData(data.task);
        }

	if(typeof data.instructions != "undefined"){
                receiveInstructionData(data.instructions[0]);
        }
	
    });

});
function sendMsg(data){
	socket.emit("message",{"content":data,"timeStamp":new Date().getTime(), "player_id":-1, "player_initials":"HQ", "skill":null});
}

function sendBackAck(ackid){
	socket.emit("ack",{"ackid":ackid,"channel":$("#layer_id").val()});
}



