



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

app.controller("testPanelCtrl", function($scope,httpService){
	$scope.frame = 0;

	$scope.getFrame = function(){
		$.get("/test/" + G_game_id+ "/" + $scope.frame  + "/getFrame",
			function(data){
				receiveHeatmapData(JSON.parse(data));
			}
		);
	}			
	
	$scope.getPlan = function(){
		$.post("/test/" + G_game_id + "/" +  $scope.frame + "/fetchplan",
			{},		
			function(data){
				//alert("data sent: " + JSON.stringify(data.sent));		
				alert("received plan: "+JSON.stringify(data.plan));					
			}				
			,"json"
		);
	}
})

app.controller("MsgCtrl",function($scope,dataService,sIOService){
	$scope.sendMsg = function(data){
		sIOService.sendMsg(data);
		$scope.msg_field = "";
	}
	sIOService.callback = function(){$scope.$apply()};
	$scope.msg_field = "";
	$scope.msgs = dataService.msgs;;
});

//requester to socketIO Listen to all kinds of data 

/*
sIOService.pushListener("event", listener);


*/


app.controller("NewAssignmentCtrl", function($scope,dataService,sIOService,parseService){
	$scope.editMode = false;
	$scope.edit_indicator = "Edit";
	

	$scope.socketIO = sIOService;
	$scope.assignments = dataService.instructions;
	$scope.players = dataService.players;
	$scope.tasks = dataService.tasks;
	$scope.aCopy = $.extend(true,[],$scope.assignments);
	$scope.prev_assignments = dataService.previous_instructions;

	var destroyD = function(){
		$( ".player-droppable" ).droppable("destroy");
		$( ".exisiting-task-droppable" ).droppable("destroy");
		$( ".task-droppable" ).droppable("destroy");
		$( ".task-draggable" ).draggable("destroy");
		$( ".player-draggable" ).draggable("destroy");
	}

	$scope.toggleEditMode = function(){
		if($scope.editMode){
			$scope.editMode = false;
			$scope.edit_indicator = "Edit";
			destroyD();
		}else{
			$scope.editMode = true;
			$scope.edit_indicator = "Finish Editing";
			$scope.initD();
		}
	}

	$scope.loadData=function(){
		dataService.loadData().then(function(result){
			$scope.players = dataService.players;
			$scope.tasks= dataService.tasks;
		});

	}

	var count = -1;
	//watch the change in the data set
	$scope.$watch(function(){ return dataService.instruction_frame.current_size}, function(newVal,oldVal){
		if(newVal == dataService.instruction_frame.size){
			$scope.assignments = dataService.instructions;
			$scope.aCopy = $.extend(true,[],$scope.assignments);
			console.log("data changed");
		}
	})

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
		if (a.task_id == -1) return null;

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
			if (id == -1 || id == 0) {return ""}
			var p = getById($scope.players,id);
			
			var img = "";
			//if (p == null){console.log(id);return ""}
			img = "/player/"+p.initials[0]+"/" + p.initials[1] + "/" + p.skill + "/map_icon.png"
			/*$($scope.players).each(function(index,value){
				if(value.id == id){
					img = "/img/" + value.skill + ".png";
				}
			});*/
			return img;
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
      		//skip check if task_id is -1
      		if( target_assignment.task_id == -1 ||
      			checkRequirement(getRequirement(target_assignment),getById($scope.players,player_id).skill_id)
      		){
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
    			//if two players have same skill id then ok to exchange.
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

		var validateAssigments = function(a){
			var type = getById($scope.tasks, a.task_id).type;
			var r = dataService.requirements[type];
			var p1 = getById($scope.players, a.player1);
			var p2 = getById($scope.players, a.player2);
			p1_validated = false;
			p2_validated = false;
			$(r).each(function(index,value){
				if(p1!=null&&value == p1.skill_id){
					p1_validated = true;
				}
				if(p2!=null&&value == p2.skill_id){
					p2_validated = true;
				}
			});
			if(!p1_validated) a.player1 = -1;
			if(!p2_validated) a.player2 = -1;
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
      			var assig = getById($scope.aCopy, target_assignment_id)
      			assig.task_id = task_id;
      			validateAssigments(assig);

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
			return true;
		}
		return false;
		
	}

	$scope.getEditClass = function(){
		if($scope.editMode){
			return "card"
		}
		else {
			return "card-fixed"
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

	var compareAssignments = function(a,set){
		var found = false;
		$(set).each(function(index,value){
			if(value.task_id == a.task_id){
				if( (a.player1 == value.player1 && a.player2 == value.player2 ) ||
					(a.player2 == value.player1 && a.player1 == value.player2 ) ){
					found = true;
				}
				
			}
		});
		return found; 
	}



	$scope.unchanged = function(a){
		return compareAssignments(a,$scope.prev_assignments);
	}


	$scope.changed = function(a){
		return !compareAssignments(a,$scope.prev_assignments);
			}

	$scope.pUnchanged = function(a){
		return compareAssignments(a,$scope.aCopy);
	}


	$scope.pChanged = function(a){
		return !compareAssignments(a,$scope.aCopy);
	}
	
	$scope.showRequirement = function(a,preference){
		if(a.task_id == -1){
			return "-"
		}
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



