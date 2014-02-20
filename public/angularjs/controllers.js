var app = angular.module('AtomicOrchidJs',[]);
app.factory("dataService",function(){
	return {
		//sample data 
		tasks: [{id:0,type:0},{id:1,type:2},{id:2, type:3},{id:3,type:2}],
		players: [
				{id:0,skill:"firefighter"},
				{id:1,skill:"medic"},
				{id:2,skill:"soldier"},
				{id:3,skill:"transporter"},
				{id:4,skill:"transporter"}

			],
		instructions: [
				{id:0,task_id: 0,  player1:0,player2:1},
				{id:1,task_id: 1,  player1:2,player2:3}
			],
		previous_instructions: [
				{id:2,task_id: 3,  player1:2,player2:0},
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

});



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

	var requirement = function(){
		//get reuqirement from a assignmen.
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
		$scope.aCopy.push({id:count--, task_id: task_id, type:getTask(task_id).type, player1:-1,player2:-1});
		
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
      		getById($scope.aCopy, target_assignment_id)["player"+target_player_holder] = player_id;
      		
        }

        var dropPlayer = function(target,event,ui){
        	var player_id = ui.helper[0].attributes.playerId.nodeValue;
        	var assignment_id = ui.helper[0].attributes.assignmentId.nodeValue;
        	var player_holder = ui.helper[0].attributes.playerHolder.nodeValue;
      		var target_assignment_id = $(target)[0].attributes.assignmentId.nodeValue;
      		var target_player_holder = $(target)[0].attributes.playerHolder.nodeValue;
      		var target_player_id = $(target)[0].attributes.playerId.nodeValue;
      			
      		//erase original card
      		getById($scope.aCopy, assignment_id)["player"+player_holder] = target_player_id ;
      		//assign target
      		getById($scope.aCopy, target_assignment_id)["player"+target_player_holder] = player_id;

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
      			if(assignment != null){
      				dropPlayer(this,event,ui);	
      			}
      			else{
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
	
});

app.controller("prevTaskListCtrl", function($scope,dataService){
	
});

