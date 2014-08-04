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

         var bounds = new google.maps.LatLngBounds();
                        $(tasks).each(function(index,value){
                                bounds.extend(new google.maps.LatLng(value.marker.getPosition().lat(), value.marker.getPosition().lng()));
                        });     

                        //set 
                        map.fitBounds(bounds);


	}); 
}

function sendMsg(data){
	socket.emit("message",{"content":data,"timeStamp":Math.floor((new Date().getTime())/1000), "player_id":-1, "player_initials":"HQ", "skill":null});
}

function sendBackAck(ackid){
	socket.emit("ack",{"ackid":ackid,"channel":$("#layer_id").val()});
}

var G_game_id;
$(document).ready(function() {
    loadData();
    G_game_id = $("#layer_id").val();
    //CALL angular data from outside the framework
    angular.element($("#main")).scope().loadData();
    $('#msgModal').on('hidden.bs.modal', function () {
   		angular.element($("#main")).scope().markRead(G_msg_player);
	})
});


