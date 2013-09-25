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
function play(callback){
	stop=false;
	oneStep(index,callback);
}

function pause(callback){
	if(current_task!=null){
		clearInterval(current_task);
	}
	stop=true;
}

function oneStep(i,callback){
     var interval;
    
     if(i==log.length-1){
        return
     }
     else{
        interval=(log[i+1].time_stamp-log[i].time_stamp);
     } 

     process_data(log[i]);
     callback(log[i].time_stamp-base_time);
     current_task=setTimeout(function(){
        
        if(!stop){
		index=i;
        	oneStep(++i,callback);
        }
       
     },interval/speed);

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
                receiveTaskData(data.task);
        }
	
        if(typeof data.instructions != "undefined"){
                receiveInstructionDataV3(data.instructions[0]);
        }
	
        
}

function draw_stroke(p1, p2){

}

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



$(document).ready(function() {
	setup = true;
	//updateGame(true);
	get_data();
	setup_game();
});





