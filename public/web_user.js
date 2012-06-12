$(document).ready(function() {
	updateGame(true);
	id='user'+(new Date()).getTime();
	connect('http://holt.mrl.nott.ac.uk:49991', id , "user", "observer", 
		"acc_exposure-"+$("#group_token").val()+
		",locations-"+$("#group_token").val(),
		newreceiver, statechange);
});

function statechange(receivername,updates,timestamp,values) {
	//parse id
		//example "exposure-1/server-52"
		//parse to channel:exposure, user_id:52
		var temp=receivername.split("/");
		var user_id;
		var channel;
		channel=(temp[0].split("-"))[0];
		temp=temp[1].split("-");
		user_id= temp[temp.length-1];
		
		for (var key in updates) {
			console.log("hander : "+ user_id +" "+ key + " " + updates[key]);
		}
		
		var old_style_json=new Object;
		
		if (channel=="acc_exposure"){
			//convert ot old json schema
			old_style_json["player_id"]=user_id;
			old_style_json["value"]=upates["acc_exposure"];
			
			receiveExposureData(old_style_json);
		}
		else if (channel=="locations"){
			old_style_json["player_id"]=user_id;
			if (updates["latitude"]!=null) {old_style_json["latitude"]=updates["latitude"]}else{return;}
			if (updates["longitude"]!=null) {old_style_json["longitude"]=updates["longitude"]}else{return;}
			old_style_json["skill"]=values["skill"];
			old_style_json["initials"]=values["initials"];
			
			receivePlayerData(old_style_json);
			
		}
		else if (channel=="player_info"){
			//ignore the first loading of state, avoid conflict with updateGame
			old_style_json["player_id"]=user_id;
			if (rece.first){
				rece.first=false;
				return;
			}
			
			//convert ot old json schema
			if (updates["name"]!=null) {old_style_json["name"]=updates["name"]}else{return;}
			if (updates["skill"]!=null) {old_style_json["skill"]=updates["skill"]}else{return};
			
			receivePlayerInfoData(old_style_json);
		}
		
		else if (channel=="system"){
			old_style_json["player_id"]=user_id;
			var rece=peer.receivers[receivername];
			
			//ignore the first loading of state, allow onoff signal
			if (rece.first){
				rece.first=false;
			}
			else{
				system(updates["signal"]);
			}
			
			
		}
		else if (channel=="tasks"){
			//convert ot old json schema
			old_style_json["player_id"]=user_id;
			if (updates["latitude"]!=null) {old_style_json["latitude"]=updates["latitude"]}else{return;}
			if (updates["longitude"]!=null) {old_style_json["longitude"]=updates["longitude"]}else{return;}
			if (updates["requirement"]!=null) {old_style_json["requirement"]=updates["requirement"]}else{return;}
			if (updates["state"]!=null) {old_style_json["state"]=updates["state"]}else{return;}
			if (updates["id"]!=null) {old_style_json["id"]=updates["id"]}else{return;}
			if (updates["type"]!=null) {old_style_json["type"]=updates["type"]}else{return;}
			
			
			receiveTaskData(old_style_json);
		}
		else if(channel=="heatmap"){
			var rece=peer.receivers[receivername];
			if (rece.first){
				//turn off the flag
				rece.first=false;
				receiveHeatmapData(values);
			}
			else{
				receiveHeatmapData(updates);
			}
			
		
		}
}

function newreceiver(name,state) {
		console.log('newreceiver: '+name);
		var rece=peer.receivers[name];
		//notify when initial update received
		rece["first"]=true;
		
		//onchange will push a new handler.
		state.onchange(function(updates,timestamp,values) { statechange(name,updates,timestamp,values); });
		//state.list(function(values,timestamp) { statechange(name,values,timestamp,values); });
}

function getState(channel, userID, key){
	var receiver=peer.receivers[channel+"/"+userID];
	return receiver.state.values[key];
}

//this is for original server
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

function setState(keys,values){
	alert(keys+" "+values);
	var key_array=keys.split(",");
	var value_array=values.split(",");
	//key_array length == value_array length
	clientState.begin();
	for (i in key_array){
		//alert(key[i]+values[i]);
		clientState.set(key_array[i],value_array[i]);
	}
	clientState.end();
}

function handleSocketData(event,msg){
	var dataStr0 = jQuery.stringify(msg);
	var dataStr1 = dataStr0.substring(1,dataStr0.length-1);
	var data = jQuery.parseJSON(dataStr1);
	//alert("handle data "+event +" " +data);
	eventMap[event](data);
	//alert("handle finished");
}


