$(document).ready(function() {
	updateGame(true);
	id='dashboard'+(new Date()).getTime();
	connect('http://holt.mrl.nott.ac.uk:49991', id , "dashboard", "observer", 
		"acc_exposure-"+$("#group_token").val(),
		newreceiver, statechange);
});

function statechange(receivername,updates,timestamp,values) {
}

function newreceiver(name,state) {
}


//native socket.io invoke this function whenever data arrived here

/*function handleSocketData(dataStr) {
    //var data = dataStr;
    //parse string from native app
  	var dataStr0 = jQuery.stringify(dataStr);
	var dataStr1 = dataStr0.substring(1,dataStr0.length-1);
	//alert('string arrived for you: ' + dataStr1);
	var data = jQuery.parseJSON(dataStr1);
    //alert('health at ' + data.health.value);
    //alert("after parse"+jQuery.stringify(data));
    
    if(typeof data.health != "undefined") {
    	//alert('entering health');
    	receiveHealthData(data.health);
    } else {
    	//alert('did not enter health');
    	//alert(data);
    }
    
    
    if(typeof data.system != "undefined"){
        system(data.system); 
    }
    
    
    if(typeof data.heatMap != "undefined"){
    	//receiveHeatmapData(data.heatMap); heatMap data will not be broadcasted to mobile
    }
    
    if(typeof data.location != "undefined"){
    	//alert("in location");
        receivePlayerData(data.location);
    }
    
    if(typeof data.box != "undefined") {
    	receiveBoxData(data.box);
    }
    
    if(typeof data.task != "undefined") {
    	receiveTaskData(data.task);
    }
    
    if(typeof data.message != "undefined") {
    	receiveMessageData(data.message);
    }
    
    
    if(typeof data.exposure != "undefined") {
    	receiveExposureData(data.exposure);
    }
    
}*/

function handleSocketData(event,msg){
	alert("handle data "+event +" " +msg);
	eventMap[event](msg);
	alert("handle finished");
}


