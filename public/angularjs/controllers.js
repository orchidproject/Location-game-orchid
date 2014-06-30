var messages = ["road blocked.",
"unsafe structure. too dangerous",
"too tired. need rest",
"I cannot work with this guy",
"Cannot find the target",
"No visual. Can you confirm target exists."];
var G_msg_player = -1;
var G_msg_player1 = -1;
var G_msg_player2 = -1;
var G_msg_assignment1 = -1;
var G_msg_assignment2 = -1;


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
		httpService.executeScript(JSON.stringify({"command" :($scope.selected_script + " " + G_game_id)}))
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
				//alert("received plan: "+JSON.stringify(data.plan));					
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
	$scope.msgs = dataService.msgs;

	var count = 0;
	var senders = [];
	sIOService.rejectionCallback = function(id){
		senders.push(id);
		//$scope.msgs.push( {sender:id,msg: count + ":" + messages[(Math.floor(Math.random()*100))%6]});
		count++;
	}

	$scope.filterMsg = function(data){
		console.log(data);

		if( G_msg_player == data.target || G_msg_player == data.target2 ) 
		{
			return true;
		}
		return false;
	}


});

//requester to socketIO Listen to all kinds of data 
/*
sIOService.pushListener("event", listener);


*/


app.controller("NewAssignmentCtrl", function($scope,dataService,sIOService,parseService,httpService){
	$scope.editMode = false;
	$scope.edit_indicator = "Edit";
	$scope.planPending = false;
	$scope.fetching = false;

	$scope.socketIO = sIOService;
	$scope.assignments = dataService.instructions;
	$scope.players = dataService.players;
	$scope.tasks = dataService.tasks;
	$scope.aCopy = $.extend(true,[],$scope.assignments);
	$scope.prev_assignments = dataService.previous_instructions;


	/*function markTargets(t1,t2){
		$
		data.read = true;
	}*/

	$scope.msgCount = function(id){
		var count = 0;

		$(dataService.msgs).each(function(i,d){
			if ((d.target == id || d.target2 == id)  && d.read == null ) {
				count ++ ;
			}
		});
		
		return count;
	};

	function markRead(id){
		$(dataService.msgs).each(function(i,d){
			if ((d.target == id || d.target2 == id)  && d.read == null ) {
				d.read = true;
			}
		});
	}

	function clearMessages(id){
		$(dataService.msgs).each(function(i,d){
			if ( d.target == id || d.target2 == id ) {
				dataService.msgs.remove(d);
			}
		});
	}

	//so bad, so bad
	dataService.taskCallback = function(to_remove){   
        $($scope.aCopy).each(function(i,d){
        	if(compareAssignments(to_remove,d)){
        		$scope.aCopy.splice($scope.aCopy.indexOf(d),1);
        	}
        });    
    }

    $scope.openMsg = function(player_id){
    	G_msg_player = player_id;
    	
    	markRead(player_id);

    	var aid = dataService.getPreAssignmentByPlayerId(player_id);
    	G_msg_player1 = (aid!=null)? aid.player1 : G_msg_player;
    	G_msg_player2 = (aid!=null)? aid.player2 : -1;
    	G_msg_assignment1 = (aid!=null)? aid.id1 : -1;
    	G_msg_assignment2 = (aid!=null)? aid.id2 : -1;

    }

	$scope.$watch(function(){ return dataService.instruction_frame.id; }, function(oldVal,newVal){
		if(oldVal != newVal){
			$scope.planPending = true;
		}
	});

	$scope.rejected = function(a,b){
		return (a==="reject"||b==="reject");
	}

	//watch the change in the data set
	$scope.$watch(function(){ return dataService.instruction_frame.current_size}, function(newVal,oldVal){
		if(newVal == dataService.instruction_frame.size){
			$scope.assignments = dataService.instructions;
			$scope.aCopy = $.extend(true,[],$scope.assignments);
			var all_same = true;

			if(dataService.previous_instructions.length == 0 
				&& $scope.aCopy.length == 0) 
			{alert("No more plans"); return;} ;

			$($scope.aCopy).each(function(i,d1){
				var same = false;
				$(dataService.previous_instructions).each(function(i,d2){
				 	if(compareAssignments(d1,d2)){
				 		same = true;
				 	}
				});
				if(!same){
					all_same = false;
				}
			});

			if(all_same){
				alert("No new task assignments for rejecting team. Press Edit to assign task manually.");
			}
		}
	});

	$scope.initEditables = function(){
		if($scope.editMode){
			$scope.initD();
		}
	}

	$scope.getHealth = function(id){
		if(id == -1){
			return;
		}

		var p = dataService.getPlayerById(id)		
		var h = p.health;
		return (100-h) + "%";
	}

	var destroyD = function(){
		$( ".player-droppable" ).droppable("destroy");
		$( ".exisiting-task-droppable" ).droppable("destroy");
		$( ".task-droppable" ).droppable("destroy");
		$( ".task-draggable" ).draggable("destroy");
		$( ".player-draggable" ).draggable("destroy");
	}

	$scope.allowConfirm = function(){
		var allow = true;
		$($scope.aCopy).each(function(i,d){
			if(d.player1 == -1 || d.player2 == -1) { allow = false };
		});

		if(!$scope.planPending){ return false; }

		return allow;
	}

	$scope.toggleEditMode = function(option){

		if(option == false){
			if(!$scope.editMode){return};
			$scope.editMode = false;
			$scope.edit_indicator = "Edit";
			destroyD();
			return 
		}
		else if(option == true){
			if($scope.editMode){return};
			$scope.editMode = true;
			$scope.edit_indicator = "Finish Editing";
			$scope.initD();
			return
		}

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

	$scope.confirmAll = function(clear){
		if($scope.aCopy.length == 0){return;}

		//alert(JSON.stringify($scope.aCopy));
		//numberising data
		//must need to be number, otherwise there would be bug!!!! do not know why
		$($scope.aCopy).each(function(i,d){
			d.player1 = parseInt(d.player1);
			d.player2 = parseInt(d.player2);
		});
		
		if(clear){
			$($scope.aCopy).each(function(i,d){
			d.response1 = "no response";
			d.response2 = "no response";
			d.keep = false;
			});

			//copy status
			copyStatus($scope.aCopy,dataService.previous_instructions);
			dataService.previous_instructions = $scope.aCopy;

			httpService.confirmPlan({"plan":dataService.previous_instructions});

			$scope.prev_assignments = dataService.previous_instructions;
			
			dataService.instructions = [];
			//this is just a set of copy for undo
			$scope.assignments = dataService.instructions;

			//aCopy is for editing, will snyc with assignments, but should not be a pointer to same thing
			$scope.aCopy = [];
			$scope.planPending = false;
			$scope.toggleEditMode(false);
		}
		else{
			httpService.confirmPlan({"plan":dataService.previous_instructions});
		}

	}

	var copyStatus =function(copyee,copyer){
		$(copyer).each(function(i,c2){
			var copied = false;
			$(copyee).each(function(i,c1){

				if(compareAssignments(c1,c2)){
					copied = true;
					c1.response1 = c2.response1;
					c1.response2 = c2.response2;
					c1.keep = c2.keep;
				}
			});

			if(!copied){
				clearMessages(c2.player1);
				clearMessages(c2.player2);
			}

		});
	}

	$scope.getPlan = function(){
		$scope.fetching = true;
		//check keeps
		var all_keeps = true;
		$(dataService.previous_instructions).each(function(i,v){
			if(v.keep == false) all_keeps = false;
		});
		if(all_keeps && dataService.previous_instructions.length != 0){
			alert("You chose to keep all the changes, so plan request does not send");
			$scope.fetching = false;
			return;
		}

		httpService.requestPlan(dataService.previous_instructions).then(function(result){
			$scope.fetching = false;		
			$scope.$apply();
			//alert(JSON.stringify(result.data.sent));
		});
		
	}

	$scope.loadData=function(){
		dataService.loadData().then(function(result){
			$scope.players = dataService.players;
			$scope.tasks= dataService.tasks;
		});

	}

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
		var task_id_s = task_id+"";
		return (task==null)? "": "/player/" + task_id_s[task_id_s.length-2] + "/" + task_id%10 + "/task_icon" + (task.type+1) + "/map_icon.png";
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
		if(task.state == 2) return false;
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

		if(f<=0){
			var p = dataService.getPlayerById(-1-f);
			var l = new google.maps.LatLng(p.latitude, p.longitude);
			var c = G_getPixelFromMap(l);
			
			G_d3HighLight(c.x,c.y);
		}
		if(f>0){
			var t = dataService.getTaskById(f);
			var l = new google.maps.LatLng(t.latitude, t.longitude);
			var c = G_getPixelFromMap(l);
			
			G_d3HighLight(c.x,c.y);
		}
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
		if(a.task_id == -1 && a.task_id!=null){
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

	}

	

	var checkoutSingle = function(assignment){
		var to_delete = [];
		$($scope.prev_assignments).each(function(index,value){

			if(
				value.task_id == assignment.task_id ||
				value.player1 == assignment.player1 || 
				value.player1 == assignment.player2 ||
				value.player2 == assignment.player1 ||
				value.player2 == assignment.player2 
			){
				to_delete.push(value);
			}
		});

		$(to_delete).each(function(index,value){
			var index = $scope.prev_assignments.indexOf(value);
			$scope.prev_assignments.splice(index,1);
		})

		//make a copy
		assignment.response1 = "no response";
		assignment.response2 = "no response";
		var new_assignment = JSON.parse(JSON.stringify(assignment));
		
		$scope.prev_assignments.push(new_assignment);

	}

	$scope.confirmSingle = function(assignment){
		//checkout single 
		checkoutSingle(assignment);
		//confirm_all
		$scope.confirmAll(false);
	}

	$scope.emergencyStop = function(a){
		var index = $scope.prev_assignments.indexOf(a);
		$scope.prev_assignments.splice(index,1);
		$scope.aCopy = $scope.aCopy = $.extend(true,[],$scope.prev_assignments);
		
		$scope.confirmAll(false);
	}

	$scope.allowConfirmSingle = function(a){
		if(a.task!=-1 && a.player1 != -1 && a.player2!= -1){
			return false;
		}
		return true;
	}

});



