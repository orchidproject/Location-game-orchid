//model of game 

function Game(game_id){
	this.id=game_id;
	var tasks=[];
	var dropOffZones=[];
	var players=[];

	this.simulation_file=null;//string
	this.sim_lat= null;//float
	this.sim_lng= null;//float
	this.grid_size=null;//float
	this.sim_update_interval=null;//float
	this.terrains = null;//string JSON string representing terrains(in 2Darray) 

	//hook functions
	this.taskAdded = null;
	this.taskRemoved = null;
	this.dropOffZoneAdded = null;
	this.dropOffZoneRemobed = null;	
	this.beforeSave = null;
		
	this.copyTerrains =  function(){
		var array = [];
		$(this.terrains).each(function(index,value){
			var sub_array = [];
			$(value).each(function(index,value){
				sub_array.push(value);	
			});	
			array.push(value);
		});
		return array;

	}
	this.addTask= function(task){
		tasks.push(task);
		if(this.taskAdded != null){
			this.taskAdded(task);	
		}
	}

	this.getTask = function(id){
	}
	
	//dangerous to directly operate with tasks
	this.getTasks = function(){
		return tasks;
	}
	
	this.addDropOffZone= function(dpzone){
		dropOffZones.push(dpzone);
		if(this.dropOffZoneAdded!= null){
			this.dropOffZoneAdded(dpzone);
		}
	}

	this.getDropOffZone = function(id){
		return dropOffZones;
	}

	this.updateGameSettings = function(){
		if(this.beforeSave!=null) this.beforeSave();
		//reconstruct arrays
		var tasks_to_upload =  [];
		$(tasks).each(function(index,value){
			tasks_to_upload.push(
				{latitude:value.latitude,longitude:value.longitude,type:value.type});
		});
		var dpZones_to_upload = []; 
		$(dropOffZones).each(function(index,value){
			dpZones_to_upload.push(
				{latitude:value.latitude,longitude:value.longitude,radius:value.radius});
		});

		var instance = this
		$.post("/admin/games/" + instance.id + "/updateGameSettings",
			{
				sim_lat : this.sim_lat,
				sim_lng : this.sim_lng,
				simulation_file : this.simulation_file,
				sim_update_interval : this.sim_update_interval,
				grid_size : this.grid_size,
				terrains : JSON.stringify(this.terrains),
				tasks : tasks_to_upload ,
				dropOffPoints : dpZones_to_upload 

			},
			function(data){
				if(data.saved)alert("settings saved");
				window.location.reload(true);
			},
		"json");

	}
}


Game.prototype.loadData = function(callback){
	var instance = this;
	$.ajax({ 
		url: "/game/"+this.id+"/status.json",
		type: "GET",
		dataType: "json", 
		success: function(data) {
			instance.tasks = data.tasks;
			instance.dropOffZones = data.dropOffZones;
			instance.simulation_file=data.simulation_file;
			//TODO validation	
			instance.sim_lat=parseFloat(data.sim_lat);
			instance.sim_lng=parseFloat(data.sim_lng);
			instance.grid_size=parseFloat(data.grid_size);
			instance.sim_update_interval=parseFloat(data.sim_update_interval);
			//terrain data is retrieved as a long string		
			instance.terrains=jQuery.parseJSON(data.terrains);
			if(callback!=null){
				callback(instance); 
			} 
		}

	});	

}

Game.prototype.uploadData = function(){

}

//simulation_file_info
function Simulations(){
	this.filenames = []; 
	this.x_size = [];
	this.y_size = [];
	this.frame = [];
}

Simulations.prototype.loadData = function(callback){
	var instance = this;
	 $.ajax({ 
		url: "/admin/simulation_files",
		type: "GET",
		dataType: "json", 
		success: function(data) {
		 	$.each(data,function(index,value){
				instance.filenames.push(value.name);		
				instance.x_size.push(value.x_size);
				instance.y_size.push(value.y_size);
				instance.frame.push(value.frame);
			});	

			if(callback!=null){
				callback(instance);
			}
		}

	});	
}


//model of task



//modle of drop off zone



//model of player
