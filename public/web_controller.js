var id;
$(document).ready(function() {
	//currently keep creating new peers in server when refresh
	updateGame(true);
	id='dashboard'+(new Date()).getTime();
	connect(SOCKET_IO_ADDRESS, id , "dashboard", "observer", 
		"acc_exposure-"+$("#group_token").val()+
		",locations-"+$("#group_token").val() + 
		",player_info-"+$("#group_token").val()+
		",tasks-"+$("#group_token").val()+
		",heatmap-"+$("#group_token").val()+
		",system-"+$("#group_token").val(),
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
			
// convert it to heatmap format
// 			var heatMapData={
//     			max: 10,
//     			//data: [{lat: 52.9545091, lng:-1.1887172, count: 10},{lat: 52.9540927, lng:-1.18750480, count: 10}]
//     		};
//     		
//     		var data=[];
//     		for(var index in values){
//     			if (values[index].lat==null||values[index].lng==null){return;}
//     			data.push({
//     				lat:values[index].lat,lng:values[index].lng,count:values[index].value
//     			});
//     		}
// 			//data.push({lat: 52.9545091, lng:-1.1887172, count: 10},{lat: 52.9540927, lng:-1.18750480, count: 10});
//     		
//     		heatMapData["data"]=data;
//     		
//     		// this is important, because if you set the data set too early, the latlng/pixel projection doesn't work
// 			google.maps.event.addListenerOnce(map, "idle", function(){
// 				heatmap.setDataSet(heatMapData);
// 			});
		
		}

}


function newreceiver(name,state) {
		console.log('newreceiver: '+name);
		//receivernames.push(name);
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

