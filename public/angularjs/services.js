

var app = angular.module('AtomicOrchidJs',[]);

app.factory("httpService",function($http){

	var service = {
		getScriptsList: function(){
			return $http.get("/agent_utility/list_scripts");
		},
		executeScript: function(data){
			$http.defaults.headers.post["Content-Type"] = "application/json";
			return $http.post("/agent_utility/execute", data);
		}

	}
	return service;

}).factory("sIOService",function(dataService){
	var socket;

	var legReceivers =  function(){
		socket.on('data', function(data) {
        	//saveLog(data);
        	//sendBackAck(data.ackid);

    		if(typeof data.health!="undefined"){
        		receiveHealthData(data.health);
        		
    		}
        
        	if(typeof data.heatmap != "undefined"){
              	receiveHeatmapData(data.heatmap);
              
        	}
        
        	//not sure whether this is implemented
        	if(typeof data.textMassage != "undefined"){
            	//receiveTextMassage(data.textMassage);
            	
        	}
        
        	if(typeof data.message != "undefined") {
            	//receiveMessageData(data.message);
            	dataService.msgs.push(data.message.content);
           
        	}
        
        	if(typeof data.location != "undefined"){
            	receivePlayerData(data.location);
        	}
        
        	if(typeof data.cleanup != "undefined"){
                cleanup(data.cleanup.player_id); 
                
        	}
        
        	if(typeof data.player != "undefined"){
                receivePlayerInfoData(data.player);
                service.callback();
        	}
        
        	if(typeof data.task != "undefined"){
                receiveTaskData(data.task);
                
        	}

    		if(typeof data.instructions != "undefined"){
        		receiveInstructionDataV3(data.instructions[0]);
        		aHandleInstructionData(data.instructions[0])
    		}
    		if(typeof data.debug != "undefined"){
        		alert(data.debug);
       		}
       		service.callback();
    	});
	}

	var aHandleInstructionData = function(data){
		//adapt data
		if(data.frame_id != dataService.instruction_frame.id){
			dataService.instruction_frame.size = data.frame_size;
			dataService.instructions = [];
			dataService.instruction_frame.id = data.frame_id;
			dataService.instruction_frame.current_size = 0;
		}
		console.log(data);
		//if task value is not in the instruction
		var assignment = dataService.getInstructionByTask(data.task);
		if(data.task!=-1){
			if(assignment == null){
				//nooot so good
				dataService.instructions.push({
					id:dataService.instructions.length, 
					id1:data.id, 
					id2:-1, 
					player1:data.player_id, 
					player2:-1,
					task_id : data.task
				});
			}
			else{
				assignment.player2 = data.player_id;
				assignment.id2 = data.id;
			}
		}
		
		dataService.instruction_frame.current_size ++;

	}


	var setupSocketIO = function(){

    	socket = io.connect(SOCKET_IO_ADDRESS, {
            transports: ['websocket', 'flashsocket', 'htmlfile']
    	});
    	//predefined keys 
    	var keys = []
    
    	socket.on('game', function(data) {
        	//debug
        	//alert("join " + $("#group_token").val());
        	//channel and id pair needed for hand shaking 
        	socket.emit('game-join', {channel:$("#group_token").val()+"-1",id:-2});
        	socket.emit('game-join', {channel:$("#group_token").val()+"-2",id:-2});
        	socket.emit('game-join', {channel:$("#group_token").val(),id:-2});
    	});
    
    	legReceivers();
    	return socket;

	}

	var listeners = []
	
	var socket = setupSocketIO();

	var service = {
		pushListener: function(key, call){
			if(listeners["key"] != null) {listeners["key"] = []}
			listeners["key"].push(call);
		},
		callback: function(){},
		sendMsg: function(data){
			socket.emit("message",{"content":data,"timeStamp":Math.floor((new Date().getTime())/1000), "player_id":-1, "player_initials":"HQ", "skill":null});
		}
	}
	
	return service;

}).factory("parseService",function(){
	return {
		role_string: ["firefighter","medic","soldier","transporter"],
		requirements: [[0,1],[1,2],[2,3],[3,0]],
		parsePlayer: function(data){
			for(i = 0; i<data.length;i++){
				data[i].skill_id = data[i].skill;
				data[i].skill = this.role_string[data[i].skill];
			}
			return data;
		}
	};
}).factory("dataService",function(parseService,$http){
	return {
		//sample data 
		role_string: parseService.role_string,
		requirements: parseService.requirements,
		tasks:  [],/*
				[{id:0,type:0},{id:1,type:1},{id:2, type:2},{id:3,type:3},
				{id:4,type:0},{id:5,type:1},{id:6, type:2},{id:7,type:3},
				{id:8,type:0},{id:9,type:1},{id:10, type:2},{id:11,type:3},
				{id:12,type:0},{id:13,type:1},{id:14, type:2},{id:15,type:3}],*/
		players: [], /*
			[
				{id:0,skill:"firefighter",skill_id:0},
				{id:1,skill:"medic",skill_id:1},
				{id:2,skill:"soldier",skill_id:2},
				{id:3,skill:"transporter",skill_id:3},
				{id:4,skill:"transporter",skill_id:3},
				{id:5,skill:"firefighter",skill_id:0},
				{id:6,skill:"medic",skill_id:1},
				{id:7,skill:"soldier",skill_id:2},
			],*/
		instructions: 
			/*[
				{id:0,task_id: 0,  player1:5,player2:1},
				{id:1,task_id: 1,  player1:6,player2:2}
			],*/
			[],
		instruction_frame: {id:-1, frame_size:0, current_size:0},
		previous_instructions: [], /*[
				{id:2,task_id: 3,  player1:1,player2:3},
				{id:3,task_id: 1,  player1:3,player2:1}
			],*/
		focus : null,



		msgs: [] ,

		loadData : function(){
			var target = this;
			return $http.get("/game/"+G_game_id+"/status.json").then(function(result){
				target.players = parseService.parsePlayer(result.data.players);
				target.tasks= parseService.parsePlayer(result.data.tasks);
				//alert(JSON.stringify(target.tasks));
			});
		},

		getInstructionByTask:function(task){
			var i = null;
			$(this.instructions).each(function(index,value){
				if(task == value.task_id){
					i = value;
				}
			});
			return i;
		}
	};


}).factory("mapService", function(){
	var service = {
		setGameArea:function(){


			var bounds = new google.maps.LatLngBounds();
			$(tasks).each(function(index,value){
				bounds.extend(new google.maps.LatLng(value.marker.getPosition().lat(), value.marker.getPosition().lng()));	
			});	
			//set 
			map.fitBounds(bounds);
		},
		moveToTask: function(id){
			var task_id = id;
			if (id==null){
				//random number for demo
				task_id = Math.floor(Math.random()*10)%tasks.length;
			}
			map.panTo(new google.maps.LatLng(tasks[task_id].marker.getPosition().lat(), tasks[task_id].marker.getPosition().lng()));

		},
		renderPlans: function(){
			var task_id = 0;
			$(players).each(function(index,value){
				if(value!=null){
				task_id = Math.floor(Math.random()*10)%tasks.length;
				new google.maps.Polyline ({
					map:map,
					path:[
						tasks[task_id].marker.getPosition(),
						value.marker.getPosition()]
					}); 
				}
			});
		}

	} 
	return service; 

});
