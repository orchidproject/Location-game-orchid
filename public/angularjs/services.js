

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

}).factory("sIOService",function(){
	setupSocketIO();
	var service = {
		
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
		tasks:  [{id:0,type:0},{id:1,type:1},{id:2, type:2},{id:3,type:3},
				{id:4,type:0},{id:5,type:1},{id:6, type:2},{id:7,type:3},
				{id:8,type:0},{id:9,type:1},{id:10, type:2},{id:11,type:3},
				{id:12,type:0},{id:13,type:1},{id:14, type:2},{id:15,type:3}],
		players: 
			[
				{id:0,skill:"firefighter",skill_id:0},
				{id:1,skill:"medic",skill_id:1},
				{id:2,skill:"soldier",skill_id:2},
				{id:3,skill:"transporter",skill_id:3},
				{id:4,skill:"transporter",skill_id:3},
				{id:5,skill:"firefighter",skill_id:0},
				{id:6,skill:"medic",skill_id:1},
				{id:7,skill:"soldier",skill_id:2},
			],
		//players:[],
		instructions: [
				{id:0,task_id: 0,  player1:5,player2:1},
				{id:1,task_id: 1,  player1:6,player2:2}
			],
		previous_instructions: [
				{id:2,task_id: 3,  player1:1,player2:0},
				{id:3,task_id: 0,  player1:4,player2:2}
			],
		focus : null,

		loadData : function(){
			var target = this;
			return $http.get("/game/"+G_game_id+"/status.json").then(function(result){
				target.players = parseService.parsePlayer(result.data.players);
			});
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
