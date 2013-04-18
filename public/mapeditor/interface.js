var game;
var simulations;
var global_bound;
var loadCount=0;
var edit_state=0;


var widgets = {
	top_left_marker: new google.maps.Marker({
		icon:"/img/mapeditor/start_location.png",
	}),
	grid: null,
	terrains: null,
}

var mapUtility =  {
	makebounds: function( nw, metersEast, metersSouth ) {
			    var ne = google.maps.geometry.spherical.computeOffset(
				nw, metersEast, 90
			    );
			    var sw = google.maps.geometry.spherical.computeOffset(
				nw, metersSouth, 180
			    );
			    return new google.maps.LatLngBounds( sw, ne );
			},				
	createArray2D: function(x, y,defualt){
			var array2D = new Array(x);
			for(var i=0; i<x;i++){
				array2D[i]=new Array(y);
				if(defualt!= null){
					for(var j=0;j<y;j++){
						array2D[i][j] = defualt;
					}
				}
			}
			return array2D;
		      }
}
//state controls
function addTaskHandler(type){
	google.maps.event.clearListeners(map, "click");
	google.maps.event.addListener(map,"click",function(event){
		var task = {latitude: event.latLng.lat() , 
			    longitude: event.latLng.lng(), 
			    state:1,type:type };
		game.addTask(task,true);	
	});

} 
function select_edit_state(state_to_be){
	var previous_state = edit_state;
	unselect_edit_state(previous_state);
	switch(state_to_be){
		case 0: //idle state
			edit_state=state_to_be;
			break
		case 1: //add resource
			addTaskHandler(0);	
			edit_state=state_to_be;
			break;	
		case 2: //add fuel
			addTaskHandler(3);	
			edit_state=state_to_be;
			break;	
		case 3: //add Person 
			addTaskHandler(2);
			edit_state=state_to_be;
			break;	
		case 4: //add Animal
			addTaskHandler(1);
			edit_state=state_to_be;
			break;
		case 5: //reomove targets
			var tasks = game.getTasks();
			$.each(game.getTasks(),function(index,task){
				google.maps.event.addListener(task.marker, 'click', function(event){
					//this actually hack into the model
					tasks.splice(index,1); 
					task.marker.setMap(null);
				});
			});
			break;
			edit_state=state_to_be;
		case 6: //add drop off zones
			$("#radius").attr("disabled",true);
			google.maps.event.addListener(map,'click',function(event){
				game.addDropOffZone({radius:parseInt($("#radius").val()),
							latitude:event.latLng.lat(),
							longitude:event.latLng.lng()},
							true);		
			});
			edit_state=state_to_be;
			break;
		case 7://remove drop off zones 
			var dps = game.getDropOffZone();
			$.each(dps,function(index,dp){
				google.maps.event.addListener(dp.marker, 'click', function(event){
					//this actually hack into the model
					dps.splice(index,1); 
					dp.marker.setMap(null);
				});
			});
			break;
			edit_state=state_to_be;
			break;
		case 8:
			$("#sim_lat").attr("disabled",true);
			$("#sim_lng").attr("disabled",true);
			edit_state=state_to_be;
			google.maps.event.addListener(map,'click',function(event){
				widgets.top_left_marker.setPosition(event.latLng);	
				game.sim_lat = event.latLng.lat();
				game.sim_lng = event.latLng.lng();
				$("#sim_lat").val(event.latLng.lat());
				$("#sim_lng").val(event.latLng.lng());
			});
			break; 
	}


}

function unselect_edit_state(state){
	google.maps.event.clearListeners(map, "click");
	switch(state){
		case 5:
			$.each(game.getTasks(),function(index,task){
				google.maps.event.clearListeners(task.marker,'click'); 
			});
			break;
		case 6:
			$("#radius").attr("disabled",false);
			break;
		case 8:
			$("#sim_lat").attr("disabled",false);
			$("#sim_lng").attr("disabled",false);
			break;
	}

}

//tab controls

function switch_tab(tab){
	switch(tab){
		case 0:
			showTasks();	
		break;
		case 1:
			showDropOffZone();
		break;
		case 2:
			widgets.top_left_marker.setPosition(new google.maps.LatLng($("#sim_lat").val(),$("#sim_lng").val()));
			widgets.top_left_marker.setMap(map);
		break;
		case 3:
			showGrid();	
		break;



	}

}

function clear_tab(previous_tab){
	switch(previous_tab){
		case 0:
			hideTasks();	
		break;
		case 1:
			hideDropOffZone();
		break;
		case 2: 
			widgets.top_left_marker.setMap(null);
		break;
		case 3:
			clearGrid(false);	
		break;

	}

}
function showGrid(){
	if (widgets.grid != null){
		$.each(widgets.grid,function(index,sub_array){
			$.each(sub_array, function(index,element){
				element.setVisible(true);	
			});
		});
				
		map.fitBounds(global_bound);	
		return;
	}
	else{
		global_bound = null;
	}
		 
	widgets.grid = [];
	var origin = new google.maps.LatLng(game.sim_lat,game.sim_lng);	
	var nw = origin; 
	
	var x_size = simulations.x_size[$("#simulation-select")[0].selectedIndex];
	var y_size = simulations.y_size[$("#simulation-select")[0].selectedIndex];

	for (var i=0; i<x_size;i++) {
		widgets.grid[i] = [];
		for (var j=0; j<y_size; j++){
			
			var bs = mapUtility.makebounds(nw,game.grid_size,game.grid_size);
			if(global_bound == null){
				global_bound = mapUtility.makebounds(nw,game.grid_size,game.grid_size)	;
			}else{
				global_bound.extend(bs.getNorthEast()).extend(bs.getSouthWest());
			}
			var terrain = widgets.terrains[i][j];
			var color = "";
			switch(terrain){
				case 0:
					color = "#00FF00";
					break;
				case 1:
					color = "#000000";
					break;		
			}
			var rec = createRec({bounds:bs,map:map,strokeWeight:1,fillColor:color}, i,j) 
			widgets.grid[i].push(rec);	
			//southeast of previous northwest of the nextgrid
			nw = bs.getNorthEast();
		}
	        nw = google.maps.geometry.spherical.computeOffset(
				origin, game.grid_size*(i+1), 180
	        );
	}

        map.fitBounds(global_bound);	
}
function createRec(options, x, y){
	var rec = new google.maps.Rectangle(options) 
	google.maps.event.addListener(rec, "click", function(){
		if(widgets.terrains[x][y]==0){
			widgets.terrains[x][y]=1;
			rec.setOptions({fillColor:"#000000"});	
		}
		else if (widgets.terrains[x][y]==1){
			widgets.terrains[x][y]=0;
			rec.setOptions({fillColor:"#00ff00"});	
		}
	});
	return rec;
}
function clearGrid(reset){
	if(widgets.grid == null) return;
	$.each(widgets.grid,function(index,sub_array){
		$.each(sub_array, function(index,element){
			element.setVisible(false);	
		});
	});
	if(reset){
		widgets.grid=null;
	}
}
function showDropOffZone(){
}

function hideDropOffZone(){
}

function showTasks(){
}

function hideTasks(){
}

function afterLoad(){
	//keep tracking how many request (for loading data) are finished
	loadCount++;
	if(loadCount != 2) return;
	var option_found = false;
	$("#simulation-select> option").each(function(index,option){
		if(game.simulation_file == ""){ 
			game.simulation_file = option.value;
			option_found=true;	
			return;
		}

		if(game.simulation_file == option.value)
			option.selected=true; 
		option_found = true;
	});
	if(!option_found){ 
		alert("inconsistent state: " 
			+ game.simulation_file + 
			" is not found in the list of simulation files");
		 return;
	};
	if(game.terrains.length == 0){
		widgets.terrains = mapUtility.createArray2D(
			simulations.x_size[$("#simulation-select")[0].selectedIndex],
			simulations.y_size[$("#simulation-select")[0].selectedIndex],
			0
		);
	}
	else{
		widgets.terrains=game.copyTerrains();
	}
	
	$("#grid-size").val(game.grid_size);
	$("#time-interval").val(game.sim_update_interval);

}
	
function doBeforeSave(){
	game.terrains = widgets.terrains;
	game.simulation_file = simulations.filenames[$("#simulation-select")[0].selected_index];   
}

function loadData(){
	game = new Game(layerId);
	game.loadData(function(data){
	
		afterLoad();
	});

	simulations = new Simulations(); 
	simulations.loadData(function(data){
		$.each(data.filenames, function(index,value){
			$("#simulation-select").append("<option value="+value+" >" +value+ "</option>");	
			$("#simulation-size").text("size: "+data.x_size[index] + "*" +data.y_size[index]);
			$("#simulation-frame").text("frames: "+data.frame[index]);
		});	
		afterLoad();
	});

}
$(function(){
	loadData();	

	$("#simulation-select").change(function(event){
		var index = event.target.selectedIndex;
		if(!confirm("are you sure you want to switch sim file, it will wipe your current edits"))return;
		$("#simulation-size").text("size: "+simulations.x_size[index] + "*" +simulations.y_size[index]);
		if(game.terrains.length!=0 && game.simulation_file == simulations.filenames[index]){ 
			widgets.terrains=game.copyTerrains();
		}
		else{		
			widgets.terrains = mapUtility.createArray2D(
				simulations.x_size[index],
				simulations.y_size[index],
				0
			);
		}

		$("#simulation-frame").text("frames: "+simulations.frame[event.target.selectedIndex]);
		clearGrid(true);
		showGrid();

	});

	$("#grid-size").change(function(event){ 
		if(isNaN(event.target.value)){
			alert("illegal number");
			event.target.value=game.grid_size;		
			return;
		}
		var new_value= parseFloat(event.target.value);
		if(new_value == game.grid_size){
			event.target.value=game.grid_size;		
			return;	
		}
		game.grid_size=new_value;
		clearGrid(true);
		showGrid();
	});
	
	$("#time-interval").change(function(event){ 
		if(isNaN(event.target.value)){
			alert("illegal number");
			event.target.value=game.sim_update_interval;		
			return;
		}
		var new_value= parseFloat(event.target.value);
		if(new_value == game.sim_update_interval){
			event.target.value=game.sim_update_interval;		
			return;	
		}
		game.sim_update_interval=new_value;
	});

	$("#radius").change(function(event){ 
		if(isNaN(event.target.value)){
			alert("illegal number");
			event.target.value=10;		
			return;
		}
	});

	$("#sim_lat").change(function(event){ 
		if(isNaN(event.target.value)){
			alert("illegal number");
			event.target.value=game.sim_lat;		
			return;
		}
		var new_value= parseFloat(event.target.value);
		if(game.sim_lat!=new_value) $("#set-location").attr("disabled",false);
	});

	$("#sim_lng").change(function(event){ 
		if(isNaN(event.target.value)){
			alert("illegal number");
			event.target.value=game.sim_lng;		
			return;
		}
		var new_value= parseFloat(event.target.value);
		if(game.sim_lng!=new_value) $("#set-location").attr("disabled",false);
	});


	//initialize tab wedget
	$("#editor-tabs" ).tabs({
		activate:function(event,ui){
				var newIndex = ui.newTab.index();
				var oldIndex = ui.oldTab.index();
				switch_tab(newIndex);
				clear_tab(oldIndex);
			}

	}); 
        $(".targets-selectable li").click(function(){
		if(!$(this).hasClass("ui-selected")){
			$(this).addClass("ui-selected").siblings().removeClass("ui-selected");
			var action =$(this).attr("actionId");
			select_edit_state(parseInt(action));
		}
		else{
			$(this).removeClass("ui-selected");
			select_edit_state(0);
		}
		
	});


	$("#move-to-location").click(function(){
		map.setCenter(new google.maps.LatLng(
			game.sim_lat,
			game.sim_lng
		));

	});
	$("#set-location").click(function(){
			game.sim_lat = $("#sim_lat").val();
			game.sim_lng = $("#sim_lng").val();
			widgets.top_left_marker.setPosition(new google.maps.LatLng(game.sim_lat,game.sim_lng));
			$(this).attr("disabled",true);
	});

	$("#save-button").click(function(){
		game.updateGameSettings();	
	});
	
	$("#reset-button").click(function(){
		window.location.reload(true);	
	});



	//set draw task callback	
	game.taskAdded = drawTask;
	game.dropOffZoneAdded = drawDpZone;
	game.beforeSave = doBeforeSave;
});
