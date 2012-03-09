var replay = true;
var log;
function get_data(){
    $.ajax({ 
		url: "/get_log/"+$("#group_token").val()+"/",
		type: "GET",
		success: function(data) {
            if (typeof data.error != 'undefined'){
                alert(data.error);
            }
            else{
                log=data.split("\n");
                $(log).each(function(i,value){
                   if(i!=log.length-1){
                        log[i]=JSON.parse(value);
                   }
                });
                
                oneStep(0);
               /* $(log).each(function(i,value){
                    if(i!=log.length-1){
                        var interval=(log[i].time_stamp-log[0].time_stamp)/100;
                        setTimeout(function(){alert("a step");},interval);
                    }
                });*/

               
            }
                   
        }
        
    });
}
function oneStep(i){
     var interval;
     if(i==0){
        interval=0;
     }
     else if(i==log.length-1){
        return
     }
     else{
        interval=(log[i].time_stamp-log[i-1].time_stamp);
     }
     setTimeout(function(){
        process_data(log[i]);
        oneStep(i+1);
     
     },interval/10);

}

function process_data(data){
    if(typeof data.system != "undefined"){
            alert(data.system);
        }
        
        if(typeof data.player != "undefined"){
            receivePlayerData(data.player);
        }
        
        if(typeof data.textMassage != "undefined"){
            receiveTextMassage(data.textMassage);
        }
        
        if(typeof data.location != "undefined"){
            receiveLocationData(data.location);
        }
        
        if(typeof data.request != "undefined"){
            receiveRequestData(data.request);
        }
        
        if(typeof data.reading != "undefined"){
                receiveReadingData(data.reading);
        }
            
        if(typeof data.cargo != "undefined"){
                receiveCargoData(data.cargo);
        }
        
        if(typeof data.cleanup != "undefined"){
                cleanup(data.cleanup);
        }


}

$(document).ready(function() {
	setup = true;
	updateGame(true);

    get_data();
    
       

});





