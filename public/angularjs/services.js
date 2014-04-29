

var app = angular.module('AtomicOrchidJs',[]);

app.factory("httpService",function($http){

	var service = {
		getScriptsList: function(){
			return $http.get("/agent_utility/list_scripts");
		},
		executeScript: function(data){
			$http.defaults.headers.post["Content-Type"] = "application/json";
			return $http.post("/agent_utility/execute", data);
		},
		confirmPlan: function(data){
			$http.defaults.headers.post["Content-Type"] = "application/json";
			return $http.post("/game/"+G_game_id+"/confirm_plan", data);
		},
		requestPlan: function(data){
			//frame set to 0 , does not matter, if game has began, frame will be ignored
			return $http.post("/test/" + G_game_id + "/" +  0 + "/fetchplan", data);
		}

	}
	return service;

}).factory("sIOService",function(dataService){
	var socket;

	var legReceivers =  function(){
		G_socket = socket;
		socket.on('data', function(data) {
        	//saveLog(data);
        	//sendBackAck(data.ackid);


    		if(typeof data.health!="undefined"){
        		//receiveHealthData(data.health);
        		aHandleHealthData(data.health);
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
        		aHandleLocationData(data.location);
            	receivePlayerData(data.location);      	
        	}
        
        	if(typeof data.cleanup != "undefined"){
                cleanup(data.cleanup.player_id); 
                
        	}
        
        	if(typeof data.player != "undefined"){
                //receivePlayerInfoData(data.player);
                aHandlePlayerInfoData(data.player);

                //service.callback();
        	}
        
        	if(typeof data.task != "undefined"){
        		aHandleTaskData(data.task);
                receiveTaskData(data.task);              
        	}

        	if(typeof data["ack-instruction"] != "undefined"){
        		aHandleAckData(data["ack-instruction"]);             
        	}

    		if(typeof data.instructions != "undefined"){
    			if(data.instructions[0].confirmed == 1){
        			receiveInstructionDataV3(data.instructions[0]);
        		}else if(data.instructions[0].confirmed == 0){
        			aHandleInstructionData(data.instructions[0]);
        		}
    		}
    		if(typeof data.debug != "undefined"){
        		alert(data.debug);
       		}
       		service.callback();
    	});
	}

	var aHandleAckData = function(data){
		//fine assume they have player_id
		var a = dataService.getPreAssignmentByPlayerId(data.player_id);
		if(a==null) return;
		if(a.player1 == data.player_id){
			a.response1 = (data.status == 2)? "accept": "reject" ;
			if(data.status != 2&&service.rejectionCallback != null) service.rejectionCallback(a.player1);
		}
		else if(a.player2 == data.player_id){
			a.response2 = (data.status == 2)? "accept": "reject" ;
			if(data.status != 2&&service.rejectionCallback != null) service.rejectionCallback(a.player2);
		}


		if(a.response1 == "accept" && a.response2 == "accept"){
			a.keep = true;
		}
		
	}

	var aHandleTaskData = function(data){
		var t = dataService.getTaskById(data.id);

		if(t!=null){
			t.latitude = data.latitude;
			t.longitude = data.longitude;
			t.state = data.state;
		//idle do noting
		}


		if(data.state == 1 ){//pick up
			//updata status
			var a = dataService.getPreAssignmentByTaskId(data.id);
			if(data.players == "") { alert("data error"); return;}
			var players = data.players.split(",");

			if(a == null){
				//unexpected, push it in array
				dataService.previous_instructions.push({id:-1, task_id: data.id, player1: players[0], player2:players[1]});
			}
			else{
				a.player1 = players[0];
				a.player2 = players[1];
			}
			
		}
		else if(data.state == 2){//dropped off
			//delete entry
			var a = dataService.getPreAssignmentByTaskId(data.id);
			if(a == null){
				//already deleted
				return;
			}
			else{
				var index = dataService.previous_instructions.indexOf(a);
				dataService.taskCallback(a);
				dataService.previous_instructions.splice(index,1);
				//delete data in aCopy
			}
			
			/*if(t!=null){
				//remove it 
				var index = dataService.tasks.indexOf(t);
				dataService.tasks.splice(index,1);
			}*/
		}

		
	}

	var aHandlePlayerInfoData = function(data){
		//alert(JSON.stringify(data));
		//assign to players 
		if(dataService.getPlayerById(data.id) == null){
			data.skill_id = dataService.role_string.indexOf(data.skill);
			data.health = 100;
			dataService.players.push(data);
		}
	}

	var aHandleLocationData = function(data){
		var player = dataService.getPlayerById(data.player_id);
		player.latitude = data.latitude;
		player.longitude = data.longitude;
	}

	var aHandleHealthData = function(data){
		//{"health":{"player_id":1,"value":100.0},"time_stamp":12000}
		var player = dataService.getPlayerById(data.player_id);
		player.health = data.value;
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
					task_id : data.task,
					path1: data.path
				});
			}
			else{
				assignment.player2 = data.player_id;
				assignment.id2 = data.id;
				assignment.path2 = data.path;
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
		},
		rejectionCallback: null
	}
	
	return service;

}).factory("parseService",function(){
	return {
		role_string: ["medic","firefighter","soldier","transporter"],
		requirements: [[2,3],[3,0],[1,0],[1,2]],
		parsePlayer: function(data){
			for(i = 0; i<data.length;i++){
				data[i].skill_id = data[i].skill;
				data[i].skill = this.role_string[data[i].skill];
				data[i].health = 100;
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
		},

		getPlayerById: function(player_id){
			var data = null;
			$(this.players).each(function(i,d){
				if (d.id ==  player_id){ data = d; }
			})
			return data;
		},

		getTaskById: function(task_id){
			var data = null;
			$(this.tasks).each(function(i,d){
				if (d.id ==  task_id){ data = d; }
			})
			return data;
		},

		getPreAssignmentByTaskId: function(task_id){
			var data = null;
			$(this.previous_instructions).each(function(i,d){
				if (d.task_id ==  task_id){ data = d; }
			})
			return data;
		},

		getPreAssignmentByPlayerId: function(pid){
			var data = null;
			$(this.previous_instructions).each(function(i,d){
				if (d.player1 ==  pid || d.player2 ==  pid){ data = d; }
			})
			return data;
		},
		taskCallback: null

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
