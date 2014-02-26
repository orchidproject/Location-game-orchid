var app = angular.module('AtomicOrchidJs',[]);
app.factory("dataService",function(){
	return {
		//sample data 
		role_string: ["firefighter","medic","soldier","transporter"],
		requirements: [[0,1],[1,2],[2,3],[3,0]],

		tasks: [{id:0,type:0},{id:1,type:1},{id:2, type:2},{id:3,type:3},
				{id:4,type:0},{id:5,type:1},{id:6, type:2},{id:7,type:3},
				{id:8,type:0},{id:9,type:1},{id:10, type:2},{id:11,type:3},
				{id:12,type:0},{id:13,type:1},{id:14, type:2},{id:15,type:3}],
		players: [
				{id:0,skill:"firefighter",skill_id:0},
				{id:1,skill:"medic",skill_id:1},
				{id:2,skill:"soldier",skill_id:2},
				{id:3,skill:"transporter",skill_id:3},
				{id:4,skill:"transporter",skill_id:3},
				{id:5,skill:"firefighter",skill_id:0},
				{id:6,skill:"medic",skill_id:1},
				{id:7,skill:"soldier",skill_id:2},
			],
		instructions: [
				{id:0,task_id: 0,  player1:4,player2:2},
				{id:1,task_id: 1,  player1:2,player2:3}
			],
		previous_instructions: [
				{id:2,task_id: 3,  player1:1,player2:0},
				{id:3,task_id: 0,  player1:4,player2:2}
			],
		focus:null	
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

}).factory("httpService",function($http){

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
});


app.controller("AgentPanelCtrl", function($scope,httpService){
	$scope.scripts = [];
	$scope.selected_scripte = " ";
	$scope.par= "";
	httpService.getScriptsList().then(function(result){
		
		$(result.data).each(function(index,value){
			$scope.scripts.push({id:value,name:value});
		});
	});
	$scope.execute = function(){
		httpService.executeScript(JSON.stringify({"command" :($scope.selected_script + " " + $scope.par)}))
		.then(function(){
			$scope.par= "";
		});
	}
})


app.controller("NewAssignmentCtrl", function($scope,dataService){
	$scope.assignments = dataService.instructions;
	$scope.players = dataService.players;
	$scope.tasks = dataService.tasks;
	$scope.aCopy = $.extend(true,[],$scope.assignments);
	$scope.prev_assignments = dataService.previous_instructions;

	var count = -1;

	var getTask = function(id){
		var data = null;
		$(dataService.tasks).each(function(index,value){
			if(value.id == id){
				data = value;
			}
		});
		return data;
	}

	var getRequirement = function(a){
		var task = getById($scope.tasks,a.task_id);
		var currentR = dataService.requirements[task.type].slice();

		$(currentR).each(function(index,value){
				if(a.player1!=-1){
					if(getById($scope.players,a.player1).skill_id == value){
						currentR[index]=-1;
					}
				}
				if(a.player2!=-1){
					if(getById($scope.players,a.player2).skill_id == value){
						currentR[index]=-1;
					}
			}

		});

		return currentR;
	}

	var clearEmptyAssignments = function(){
		
		$($scope.aCopy).each(function(index,value){
			if(value.player1 == -1 && value.player2 == -1 && value.task_id == -1){
			  $scope.aCopy.splice($scope.aCopy.indexOf(value),1);
			}
		});
	}

	var getById = function(set,id){
		var data = null;
		$(set).each(function(index,value){
			if(value.id == id){
				data = value;
			}
		});
		return data;
	}

	var eraseOriginalGrid = function(ui){
		var as_attr = ui.helper[0].attributes.assignmentId;
      			if(as_attr != null){
      				 var assignment_id = as_attr.nodeValue;
      				 //erase original card
      				 getById($scope.aCopy, assignment_id).task_id = -1;
      			}
	}


	$scope.getTaskIcon = function(task_id){
		var task = getById($scope.tasks,task_id);
		return (task==null)? "": "/img/task_icon" + (task.type+1) + ".png";
	}

	$scope.getPlayerIcon = function(id){
			var img = "";
			$($scope.players).each(function(index,value){
				if(value.id == id){
					img = "/img/" + value.skill + ".png";
				}
			});
			return img;//"/img/firefighter.png";
	}

	$scope.undoAll = function(){
		$scope.aCopy = $.extend(true,[],$scope.assignments);
	}



	$scope.taskExist = function(assignment){
		var a = assignment.task_id;
		return (assignment.task_id == -1)? false: true;
	}

	$scope.playerExist = function(assignment,option){
		return (assignment["player"+option] == -1)? false: true;
	}

	var createNewAssignments = function(task_id,player1,player2){
		//when droppble dropped on the creation tag
		//insert a new assigment with 
		$scope.aCopy.push({id:count--, task_id: task_id, player1:-1,player2:-1});
		
	}

	$scope.filterUnassignedTasks = function(task){
		var data = null 
		$($scope.aCopy).each(function(index,value){
			if(value.task_id == task.id){
				data = value;
			}
		});
		return  (data === null)? true:false;
	}

	$scope.filterIdlePlayers = function(player){
		var data = null 
		$($scope.aCopy).each(function(index,value){
			if(value.player1 == player.id || value.player2 == player.id){
				data = value;
			}
		});
		return  (data === null)? true:false;
	}

	$scope.filterPrevUnassignedTasks = function(task){
		var data = null 
		$($scope.prev_assignments).each(function(index,value){
			if(value.task_id == task.id){
				data = value;
			}
		});
		return  (data === null)? true:false;
	}

	$scope.filterPrevIdlePlayers = function(player){
		var data = null 
		$($scope.prev_assignments).each(function(index,value){
			if(value.player1 == player.id || value.player2
			 == player.id){
				data = value;
			}
		});
		return  (data === null)? true:false;
	}

	//initialize all draggables: this calling repeatedly a lot, consider refactor
	$scope.initD = function(){
  		var dropIdlePlayer = function(target,event,ui){
  			var player_id = ui.helper[0].attributes.playerId.nodeValue;
      		var target_assignment_id = $(target)[0].attributes.assignmentId.nodeValue;
      		var target_player_holder = $(target)[0].attributes.playerHolder.nodeValue;
      		var target_player_id = $(target)[0].attributes.playerId.nodeValue;
      			
      		//assign target
      		var target_assignment = getById($scope.aCopy, target_assignment_id);
      		if(checkRequirement(getRequirement(target_assignment),getById($scope.players,player_id).skill_id)){
      			target_assignment["player"+target_player_holder] = player_id;
      		}
      		
      		
        }

        var dropPlayerIdle = function(target,event,ui){
        	//delete
        	var assignment_id = ui.helper[0].attributes.assignmentId.nodeValue;
        	var player_holder = ui.helper[0].attributes.playerHolder.nodeValue;
        	//erase original card
      		getById($scope.aCopy, assignment_id)["player"+player_holder] = -1;
        }

        var dropPlayer = function(target,event,ui){
        	var player_id = ui.helper[0].attributes.playerId.nodeValue;
        	var assignment_id = ui.helper[0].attributes.assignmentId.nodeValue;
        	var player_holder = ui.helper[0].attributes.playerHolder.nodeValue;
      		var target_assignment_id = $(target)[0].attributes.assignmentId.nodeValue;
      		var target_player_holder = $(target)[0].attributes.playerHolder.nodeValue;
      		var target_player_id = $(target)[0].attributes.playerId.nodeValue;

      		var target_slot = getById($scope.aCopy, target_assignment_id)["player"+target_player_holder];
      		//if slot is empty check requirement then put
      		if(target_slot == -1){
      			//assign target
      			var target_assignment = getById($scope.aCopy, target_assignment_id);
      			if(checkRequirement(getRequirement(target_assignment),getById($scope.players,player_id).skill_id)){
      				//erase original card
      				getById($scope.aCopy, assignment_id)["player"+player_holder] = target_player_id ;
      				//assign target
      				getById($scope.aCopy, target_assignment_id)["player"+target_player_holder] = player_id;
      			}

      		}
      		else{
    			//if two players have some skill id then ok to exchange.
      			if(getById($scope.players,player_id).skill_id==getById($scope.players,target_player_id).skill_id){
      				//erase original card
      				getById($scope.aCopy, assignment_id)["player"+player_holder] = target_player_id ;
      				//assign target
      				getById($scope.aCopy, target_assignment_id)["player"+target_player_holder] = player_id;
      			}
      		}
      			
      	}

	

		var checkRequirement = function(r,skill){
			var result = false;
			$(r).each(function(index,value){
				if(skill == value){
					result = true;
				}
			});

			return result;
		}

		$( ".task-draggable" ).draggable({
  			zIndex:100,revert:true
        });
  		$( ".player-draggable" ).draggable({
  			zIndex:100,revert:true
        });

        
  		$( ".task-droppable" ).droppable({
      		drop: function( event, ui ) {
      			//extract task id from a jquery ui object
      			var task_id = ui.helper[0].attributes.taskId.nodeValue;

      			eraseOriginalGrid(ui);
        		createNewAssignments(task_id);
        		clearEmptyAssignments();
        		$scope.$apply();
      		},
      		accept:".task-draggable"
  		});

  		$( ".exisiting-task-droppable" ).droppable({
      		drop: function( event, ui ) {
      			//extract task id from a jquery ui object
      			var task_id = ui.helper[0].attributes.taskId.nodeValue;
      			var target_assignment_id = $(this)[0].attributes.assignmentId.nodeValue;

      			eraseOriginalGrid(ui);
      			//assign target
      			getById($scope.aCopy, target_assignment_id).task_id = task_id;


      			clearEmptyAssignments();
      			$scope.$apply();
      		},
      		accept:".task-draggable"
      		

  		});

  		$( ".player-droppable" ).droppable({
      		drop: function( event, ui ) {
      			var assignment = ui.helper[0].attributes.assignmentId;
      			var target_assignment = $(this)[0].attributes.assignmentId;
      			if(assignment != null && target_assignment != null){
      				dropPlayer(this,event,ui);	
      			}
      			else if(target_assignment == null && assignment != null){
      				dropPlayerIdle(this,event,ui);
      			}
      			else if(target_assignment != null) {
      				dropIdlePlayer(this,event,ui);
      			}

      			clearEmptyAssignments();
      			$scope.$apply();
      		},
      		accept:".player-draggable"
  		});


	}
	$scope.confirmA = function(){}
	$scope.deleteA = function(a){
		$scope.aCopy.splice($scope.aCopy.indexOf(a),1);
		//$scope.$apply();
	}

	//hightlight
	$scope.getClass = function(f){

		if (dataService.focus == f ){
			return "focus";
		}
		else{
			return ""
		}
	}


	$scope.focus=function(f){
		//players id mapped to [-1 -infinite], tasks mapped to [1 infinite]
		dataService.focus = f;
	}

	$scope.unFocus=function(f){
		if(dataService.focus==f){
			dataService.focus = null;
		}
	}

	$scope.unchanged = function(a){
		var found = false;
		$($scope.prev_assignments).each(function(index,value){
			if(value.task_id == a.task_id){
				if( (a.player1 == value.player1 && a.player2 == value.player2 ) ||
					(a.player2 == value.player1 && a.player1 == value.player2 ) ){
					found = true;
				}
				
			}
		});
		return found;
	}

	$scope.changed = function(a){
		var found = true;
		$($scope.prev_assignments).each(function(index,value){
			if(value.task_id == a.task_id){
				if( (a.player1 == value.player1 && a.player2 == value.player2 ) ||
					(a.player2 == value.player1 && a.player1 == value.player2 ) ){
					found = false;
				}
				
			}
		});
		return found;
	}

	$scope.showRequirement = function(a,preference){
		var r = getRequirement(a);
		var mark_index=null;
		$(r).each(function(index,value){
			if(value == -1){
				mark_index = index;
			}
		});

		if(mark_index == null){
			return dataService.role_string[r[preference]];
		}
		else{
			return dataService.role_string[r[1-mark_index]];
		}
		/*var r1 = dataService.requirements[getById($scope.tasks,a.task_id).type][0];
		var r2 = dataService.requirements[getById($scope.tasks,a.task_id).type][1];*/
		//return {r1:dataService.role_string[r1],r2:dataService.role_string[r2]};
	}
	
});



