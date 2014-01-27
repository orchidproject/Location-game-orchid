function get_data(data,callback){
    
    $.ajax({ 
		url: "/get_log/"+ data,
		type: "GET",
		success: function(data) {
		    if (typeof data.error != 'undefined'){
				alert(data.error);
		    }
		    else{
			callback(data);
		    } 
            } 
    }); 
}

// ----------------------------------------- global variables
var g_setup_data = [];
var g_log_data;
var g_base_time = 0;
// ----------------------------------------- document ready
$(function(){
	//add a loading screen 
	get_data(log,function(data){
		var new_log = [];
		var log=data.split("\n");
		$(log).each(function(i,value){
		if(i!=log.length-1){
			if(value!=""){ 
				var record = JSON.parse(value);
				new_log.push(record);
				if(record.system != null){
					g_base_time=record.time_stamp;
				} 
			}
		}
		});

		g_log_data = new_log;	
		
	}); 

	//load google chart
	
});


function get_player_by_id(id){
	var p = null;
	$(g_setup_data.players).each(function(index,value){
		if(value.id == id){
			p=value;
		} 
	}); 
	return p;
}

//assume input of an object is {latitude:,longitude:}
function get_distance(a,b){
	var p1 = new google.maps.LatLng(a.latitude,a.longitude);
	var p2 = new google.maps.LatLng(b.latitude,b.longitude);
	return google.maps.geometry.spherical.computeDistanceBetween(p1, p2); 
}


//--------------------------------------- angular js 
var analysisApp = angular.module('analysisApp', []);
 
analysisApp.controller('PlayerListCtrl', function PlayerListCtrl($scope) {
	$scope.players = g_setup_data; 
	$scope.selectedPlayer = {initials:"select a player"};
	$scope.selectedTask = {id:"select a task"};

	$scope.selectPlayer = function(p){
		$scope.selectedPlayer = p;
		$scope.analysePlayer(p);
	}

	$scope.selectTask = function(t){ 
		$scope.selectedTask = t;
		$scope.analyseTask(t); 
	}

	get_data(setup,function(data){
		g_setup_data = JSON.parse(data);
		$scope.players = g_setup_data.players; 
		$scope.tasks = g_setup_data.tasks;
		$scope.$apply();
	}); 

	
	$scope.analyseTask = function(task){
		var data = new google.visualization.DataTable();
		data.addColumn('number', 'mins'); // Implicit domain label col.
		data.addColumn('number', 'distance'); // Implicit series 1 data col.
		data.addColumn({type:'string', role:'annotation'}); // annotation role col.
		data.addColumn({type:'string', role:'annotationText'}); // annotationText col.

		var distance_data = [];

		var current_task_location = null;
		$(g_log_data).each(function(index,value){
			if(value.task!= null && value.task.id == $scope.selectedTask.id){
				current_task_location = value.task;	
			}

			if(current_task_location!=null&&value.location!= null && value.location.player_id == $scope.selectedPlayer.id){
				var distance=get_distance(value.location,current_task_location);
				distance_data.push([(value.time_stamp - g_base_time)/60000, distance,null,null]); 
			} 
			
			if(value.instructions!=null&&value.instructions[0].player_id == $scope.selectedPlayer.id){
				var ins = value.instructions[0];
				var p = get_player_by_id(ins.teammate);
				if(distance_data.length>0){
					distance_data[distance_data.length-1][2] = "i";	
					if(p!=null){
					distance_data[distance_data.length-1][3] = p.initials + " " + ins.task;	
					}
				}

			}
/*
			if(value['ack-instruction']!=null&& value['ack-instruction'].player_id == $scope.selectedPlayer.id){
				var ins = value['ack-instruction'];
				if(ins.status==2){
					if(distance_data.length>0){
						distance_data[distance_data.length-1][2] = "a";	
					}

				}else if(ins.status==3){
					if(distance_data.length>0){
						distance_data[distance_data.length-1][2] = "r";	
					}
				} 
			}
*/
		});


		
		var option = { 
			title:"Distance to task" + $scope.selectedTask.id,
			width: 1050, 
			height: 400, 
			vAxis: {maxValue: 10 }
		};
		
		data.addRows(distance_data);
		new google.visualization.LineChart(document.getElementById("distance2task")).
	      	draw( data, option);		
	};
	
	$scope.showOverview = function(){ 
		var player_status = []; //[-1, g_base_time,-1,g_base_time];//task,time 
		var timeline_chart_data = []; 
		
		//pupulate with initial state
		$($scope.players).each(function(index,value){
			player_status[value.id] =  [-1, g_base_time,-1,g_base_time,value.initials];
		});

		$(g_log_data).each(function(index,value){
			if(value.task != null){
				//test whether it is related to this player
				var relvant_players = value.task.players.split(",");
				$(relvant_players).each(function(index,pid){
					if(pid != "") { 
						if(pid == 94) { pid = 89;}
						var p_status = player_status[pid];
						if( p_status[0]==-1){
							p_status[0] = value.task.id;
							p_status[1] = value.time_stamp;
						}

						/*else if(value.task.p_status[0] == value.task.id){
							p_status[0] = -1;
							timeline_chart_data.push([
								pid,
								value.task.id+"",
								new Date(p_status[1] - g_base_time),
								new Date(value.time_stamp - g_base_time)
							]); 
							p_status[1] = value.time_stamp; 
						}*/ 
					}else{
						$(player_status).each(function(index,p_status){
							if(p_status!=null){
							if(p_status[0] == value.task.id){
								p_status[0] = -1;
								timeline_chart_data.push([
									p_status[4],
									value.task.id+"",
									new Date(p_status[1] - g_base_time),
									new Date(value.time_stamp - g_base_time)
								]); 
								p_status[1] = value.time_stamp; 	
							}
							}
						}); 
					}
				}); 
			}
		});

		$scope.draw_timeline_chart(timeline_chart_data,"overview_timeline_chart");

	};

	$scope.analysePlayer = function(player){
		var instruction_chart_data = [['x','instruction','accept','rejection']];
		var speed_chart_data = [['x','speed']]; 

		var timeline_chart_data = [];
		var player_status = [-1, g_base_time,-1,g_base_time];//task,time
		var player_location = null; 

		var accept_count = 0;
		var reject_count = 0;
		var instruction_count = 0;

		$(g_log_data).each(function(index,value){
			//process instruction
			if(value.instructions!=null&&value.instructions[0].player_id == player.id){
				var ins = value.instructions[0];
				instruction_chart_data.push([value.time_stamp-g_base_time,++instruction_count,accept_count, reject_count]);	
				if(player_status[2]!=-1){
					timeline_chart_data.push([
						"instructions",
						player_status[2]+"",
						new Date(player_status[3] - g_base_time),
						new Date(value.time_stamp - g_base_time)
					]); 
					
				} 
				player_status[3] = value.time_stamp;
				player_status[2] = ins.task; 
			}

			//process acknowledgements
			if(value['ack-instruction']!=null&& value['ack-instruction'].player_id == player.id){
				var ins = value['ack-instruction'];
				if(ins.status==2){
					accept_count++;
				}else if(ins.status==3){
					reject_count++;		
				}

				instruction_chart_data.push([
					value.time_stamp-g_base_time,
					instruction_count,
					accept_count, 
					reject_count
				]);	
			}

			if(value.task != null){
				//test whether it is related to this player
				var relvant_players = value.task.players.split(",");
				var relvant = false;
				$(relvant_players).each(function(index,pid){
					if(pid== player.id+""){ relvant = true};
				});
				if(relvant && player_status[0]==-1){
					player_status[0] = value.task.id;
					player_status[1] = value.time_stamp;
				}
				else if(!relvant&&player_status[0] == value.task.id){
					player_status[0] = -1;
					timeline_chart_data.push([
						"status",
						value.task.id+"",
						new Date(player_status[1] - g_base_time),
						new Date(value.time_stamp - g_base_time)
					]); 
					player_status[1] = value.time_stamp; 
				}
				
			}

			if(value.location!= null&&value.location.player_id == $scope.selectedPlayer.id){
				if(player_location!=null){
					var distance = get_distance(player_location.location,value.location);
					var time = (value.time_stamp - player_location.time_stamp)/1000;
					var speed = distance/time;
					if(speed<10){
						speed_chart_data.push([player_location.time_stamp-g_base_time,speed]);
					}
				}
				player_location =  value;	
			}

		}); 

		timeline_chart_data.push([
			"instructions -------------",
			"game end",
			new Date(g_log_data[g_log_data.length-1].time_stamp-g_base_time),
			new Date(g_log_data[g_log_data.length-1].time_stamp-g_base_time+10)
		]); 

		instruction_chart_data.push([ 
			g_log_data[g_log_data.length-1].time_stamp-g_base_time,
			instruction_count,
			accept_count,
			reject_count,
		]);

		var option = { 
			title:"agent instructions and responses",
			width: 1050, 
			height: 400, 
			vAxis: {maxValue: 10 }
		}; 

		$scope.draw_line_chart(instruction_chart_data,option,"instruction_chart"); 
		$scope.draw_timeline_chart(timeline_chart_data,"timeline_chart");

		option = {
			title:"speed chart",
			width: 1050, 
			height: 400, 
			vAxis: {maxValue: 10 } 
		}

		$scope.draw_line_chart(speed_chart_data,option,"speed"); 
	}

	$scope.draw_line_chart = function(dataArray,option,dom){
		var data = google.visualization.arrayToDataTable(dataArray); 
		new google.visualization.LineChart(document.getElementById(dom)).
	      	draw( data, option);		

	}

	$scope.draw_timeline_chart = function(dataArray,dom){
		var dataTable = new google.visualization.DataTable();

		dataTable.addColumn({ type: 'string', id: 'Task' });
		dataTable.addColumn({ type: 'string', id: 'Task_id' });
		dataTable.addColumn({ type: 'date', id: 'Start' });
		dataTable.addColumn({ type: 'date', id: 'End' });

		dataTable.addRows(dataArray); 
		//dataTable.addRows([["tasks","413",new Date(0), new Date(144999)]]); 
		
		new google.visualization.Timeline(document.getElementById(dom)).
	      	draw(dataTable,{height:700,width:900,title:"actions"});		
	} 

});  
