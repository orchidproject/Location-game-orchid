var replay = true;
var log_session1=null;
var log_session2=null;
var merged_log=[];

var speed=1;
var current_task=null;
var start_time=-1;
var end_time=-1;
var time;
var in_process=false;
var previous_percent=0;
var stop=true;


function merge_log(){
	//one of the log not reaching the end.
	while(log_session1.index<(log_session1.data.length-2)||log_session2.index<(log_session2.data.length-2)){
		if(log_session1.index<(log_session1.data.length-2)&&log_session2.index<(log_session2.data.length-2)){
			var temp_log=determine_log_to_perform();
			merged_log.push(temp_log.data[temp_log.index]);
			temp_log.index++;
		}
		else if(log_session1.index>=(log_session1.data.length-2)){
			var temp_log=log_session2;
			merged_log.push(temp_log.data[temp_log.index]);
			temp_log.index++;
		}
		else if(log_session2.index>=(log_session2.data.length-2)){
			var temp_log=log_session1;
			merged_log.push(temp_log.data[temp_log.index]);
			temp_log.index++;
		}
	}
	
	merged_log={data:merged_log,index:0};
	start_time=merged_log.data[0].time_stamp;
	end_time=merged_log.data[merged_log.data.length-1].time_stamp;
}


function determine_log_to_perform(){
	var timestamp1=log_session1.data[log_session1.index].time_stamp;
	var timestamp2=log_session2.data[log_session2.index].time_stamp;
	if (timestamp1<timestamp2){
		return log_session1;
	}
	else{
		return log_session2;
	}
}

function get_data(){
	var log1;
	var log2;
	
    $.ajax({ 
		url: "/get_log/"+$("#replay_file").val()+"/1",
		type: "GET",
		success: function(data) {
            if (typeof data.error != 'undefined'){
                alert(data.error);
            }
            else{
                log1=data.split("\n");
                $(log1).each(function(i,value){
                   if(i!=log1.length-1){
                        log1[i]=JSON.parse(value);
                   }
                });
                
                

                
                log_session1= {data: log1, index:0 }
                
                if(log_session2 != null & log_session1 != null){
            		merge_log();
           		}
                
                //forward_to(temp);
                //oneStep(0);
                /* $(log).each(function(i,value){
                    if(i!=log.length-1){
                        var interval=(log[i].time_stamp-log[0].time_stamp)/100;
                        setTimeout(function(){alert("a step");},interval);
                    }
                });*/

               
            }
                   
        }
        
    });
    
    $.ajax({ 
		url: "/get_log/"+$("#replay_file").val()+"/2",
		type: "GET",
		success: function(data) {
            if (typeof data.error != 'undefined'){
                alert(data.error);
            }
            else{
                log2=data.split("\n");
                $(log2).each(function(i,value){
                   if(i!=log2.length-1){
                        log2[i]=JSON.parse(value);
                   }
                });
                
                //start_time= log2[0].time_stamp;
                //end_time = log2[log2.length-2].time_stamp; //last line of log is always empty
            }
            
          
            
            log_session2= {data: log2, index:0 }
            
            if(log_session2 != null & log_session1 != null){
            	merge_log();
            }
                   
        }
        
    });
}

function get_time(percent){
	return (end_time-start_time)*percent;
}

function forward_to(percent){
	var time =  (end_time-start_time)*percent + start_time;
	var forward;
	if (previous_percent< percent){
		forward=true;
	}
	else{
		forward=false;
	}
	previous_percent=percent;
	
	if(!in_process){
		in_process=true;
		run=true
		while(run){
			var session = merged_log;
			
			var log = session.data;
			process_data(log[session.index]);
			if(forward){
				session.index++;
			}
			else{
				session.index--;
			}
			
			if(session.index>log.length-2){
				run=false;
			}
			else if(log[session.index].time_stamp<time&&log[session.index+1].time_stamp>time){
				run=false;
			}
		}
		
		in_process=false;
	}
}

function play(callback){
	stop=false;
	oneStep(merged_log.index,callback);
}

function pause(callback){
	stop=true;
}

function oneStep(i,callback){
  
     var log=merged_log.data;
     
     var interval;
     if(i==0){
        interval=0;
     }
     else if(i==log.length-2){
        return
     }
     else{
        interval=(log[i].time_stamp-log[i-1].time_stamp);
     } 
     callback((log[i].time_stamp-start_time)/(end_time-start_time));
     current_task=setTimeout(function(){
        process_data(log[i]);
        if(!stop){
        	oneStep(++(merged_log.index),callback);
        }
       
     },interval/speed);

}



function process_data(data){
    	 
        if(typeof data.acc_exposure != "undefined"){
            receiveExposureData(data.acc_exposure);
        }
        
        if(typeof data.system != "undefined"){
            //system(data.system); 
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
        
}

$(document).ready(function() {
	setup = true;
	//updateGame(true);
	get_data();
});





