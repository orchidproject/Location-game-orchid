var replay = true;
var log_session1=null;
var log_session2=null;
var log;

var speed=1;
var current_task=null;
var time;
var previous_percent=0;
var stop=true;

var base_time = -1;
var end_time=-1;

var test = false;
function get_data(){
    
    $.ajax({ 
		url: "/get_log/"+$("#replay_file").val(),
		type: "GET",
		success: function(data) {
		    if (typeof data.error != 'undefined'){
				alert(data.error);
		    }
		    else{
				var new_log = [];
				log=data.split("\n");
				$(log).each(function(i,value){
				   if(i!=log.length-1){
					if(value!=""){
						new_log.push(JSON.parse(value));
					}
				   }
				});

				log = new_log;	
				base_time = log[0].time_stamp;
				end_time = log[log.length - 1 ].time_stamp;
				$("#loading_indicator").hide();
		    }
		    setupUI();
                   
        }
        
    });
    
    
}

function get_time(percent){
	return (end_time-start_time)*percent;
}

function forward_to(sec,callback){
	var fast_forward=true;
	var current_time = Math.floor((log[index].time_stamp - base_time)/1000);

	if (sec < current_time){
		//clear heatmap data
		heatMapData = [];
		heat_map = [];

		$("#chatbox").empty();
		$(players).each(function(index,value){
			
			if(value!=null&&value.instruction!=null){
				value.instruction = null;
				value.previous_path.setMap(null)
			}
		});
		index = 0; 
		fast_forward=true;
	}
	else{
		fast_forward=false;
	}

	var forward = true;
	while(forward){
		index++;	
		process_data(log[index]);	
		var forward_time = (log[index].time_stamp-base_time)/1000;
		if( forward_time >  sec){
			forward = false;	
		}
	}
/*
	else{//reverse back to zero
		var forward = true;
		index = 0;
		while(forward){
			index++;	
			process_data(log[index]);	
			var forward_time = (log[index].time_stamp-base_time)/1000;
			if( forward_time >  sec){
				forward = false;	
			}
		}
	}
*/
}
	
		

var index=0


function pause(callback){
	if(current_task!=null){
		clearInterval(current_task);
	}
	stop=true;
}





function process_data(data){

    	if(typeof data.playerInfo != "undefined"){
            receivePlayerInfoData(data.playerInfo);
        }

        if(typeof data.health != "undefined"){
            receiveHealthData(data.health);
        }
        
        if(typeof data.system != "undefined"){
            //system(data.system); 
        }
              
        if(typeof data.heatmap != "undefined"){
              receiveHeatmapData(data.heatmap);
        }
        
        //not sure whether this is implemented
        if(typeof data.textMassage != "undefined"){
            //receiveTextMassage(data.textMassage);
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
		var task = data.task;
		task["time_stamp"] = data.time_stamp;
		check_task(task);
                receiveTaskData(data.task);
        }
	
        if(typeof data.instructions != "undefined"){
                receiveInstructionDataV3(data.instructions[0]);
		var instruction = data.instructions[0];
		instruction["time_stamp"] = data.time_stamp;
		ana_push_instructions(instruction);
        }

	if(typeof data["ack-instruction"] != "undefined"){
		var ack = data["ack-instruction"]
		ack["time_stamp"] = data.time_stamp;
		ana_push_instrucition_ack(ack);
        }

        
}

//analysis log deleted, please refer to previous stable versions.

//-------------------

function setup_game() {
	$.ajax({ 
		url: "/get_log/"+$("#setup_file").val()+"/json",
		type: "GET",
		dataType: "json", 
		success: function(data) {
		        data= JSON.parse(data);
			
            		$(data.tasks).each(function(i, task){
                    			receiveTaskData(task);
           		 });
                        
            		$(data.locations).each(function(i, location){
                    			receivePlayerData(location);
            		});
            
             		$(data.players).each(function(i, player){
                    			receivePlayerInfoData(player);
           		 });
            
            		$(data.dropoffpoints).each(function(i, drop){
                    			receiveDropoffpointData(drop);
            		});
            
		}
          
	});
}

function get_current_status(){
	var mapping = { "firefighter": 1, "medic": 0, "transporter": 3, "soldier": 2};
	var result = {players: [], tasks: []};
	$(players).each(function(index,value){
			if (value == null)
				return;

			var p = { 
			  id : value.id, 
			  latitude: value.marker.position.lat(), 
			  longitude:value.marker.position.lng(), 
			  health:100,
			  skill: mapping[value.skill]
			};
			result.players.push(p);
	});

	$(tasks).each(function(index,value){
			var t = { 
			  id : value.id, 
			  status: value.state
			};
			result.tasks.push(t);
	});

	return  result;
}



/*$(document).ready(function() {
	setup = true;
	//updateGame(true);
	get_data();
	setup_game();
});*/



function _play(callback){
	stop=false;
	var elem = angular.element(document.querySelector('[ng-controller]'));

  	//get the injector.
  	var injector = elem.injector();

  	//get the service.
  	var service = injector.get('sIOService');

	_oneStep(index,service,callback);
}


function _oneStep(i,service,callback){
     var interval;
    
     if(i==G_logs.length-1){
        return
     }
     else{
        interval=(G_logs[i+1].time_stamp - G_logs[i].time_stamp);
     } 

    //process_data(log[i]);
    //get your angular element
  	service.processData(G_logs[i]);

    if(callback != null) {
     	callback(G_logs[i].time_stamp-base_time);
    }

    current_task=setTimeout(function(){
        
    if(!stop){
		index=i;
        	_oneStep(++i,service,callback);
        }  

    },interval/100);

}

//------------------------new------------------------

var G_test;
var G_game_id;

function loadDataForReplay(state){
	game = new Game(-1); // fake one game instance
	game.loadDataForReplay(state,function(data){
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

$(document).ready(function() {
    
    G_game_id = $("#layer_id").val();
    G_test = true;
   

    $('#msgModal').on('hidden.bs.modal', function () {
   		angular.element($("#main")).scope().markRead(G_msg_player);
	});

	$("#log_input").change(loadLog);
    $("#state_input").change(loadState);

});


function _parseLog(content){
    var records = content.split("\n");
    for(i=0; i<records.length;i++){
    
    if(records[i] == "") { continue; }
        records[i] = JSON.parse(records[i]);
    }
    
    G_logs = records
    console.log("finish loading " + records.length + " records");
    _play();
}

function _parseState(content){
    //G_replay_state = 
    angular.element($("#main")).scope().loadForReplay(JSON.parse(content));
    loadDataForReplay(JSON.parse(content));
}

function _process_file(evt,callback){
    if (!(window.File && window.FileReader && window.FileList && window.Blob)){
          alert('The File APIs are not fully supported in this browser.');
          return;
    }

    var fr = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
          //console.log(e.target.result);
          callback(e.target.result);
    }
    reader.readAsText(fr);
}

function loadLog(evt){
        _process_file(evt,_parseLog);
}

function loadState(evt){
        _process_file(evt,_parseState);
}



