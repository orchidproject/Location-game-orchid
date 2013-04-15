var game;
var simulations;
var loadCount=0;


var widgets = {
	top_left_marker: new google.maps.Marker({
		icon:"/img/mapeditor/start_location.png",
	}),
	grid: null,
	terrains: null
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


function switch_tab(tab){
	switch(tab){
		case 0:
			showTasks();	
		break;
		case 1:
			showDropOffZone();
		break;
		case 2:
			widgets.top_left_marker.setPosition(new google.maps.LatLng($("#top_left_lat").val(),$("#top_left_lng").val()));
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
				element.setMap(map);	
			});
		});
		return;
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
			widgets.grid[i].push(new google.maps.Rectangle({bounds:bs,map:map,strokeWeight:1,fillColor:color}));	
			//southeast of previous northwest of the nextgrid
			nw = bs.getNorthEast();
		}
	        nw = google.maps.geometry.spherical.computeOffset(
				origin, game.grid_size*(i+1), 180
	        );
	}
}
function clearGrid(reset){
	if(widgets.grid == null) return;
	$.each(widgets.grid,function(index,sub_array){
		$.each(sub_array, function(index,element){
			element.setMap(null);	
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
		widgets.terrains=game.terrains.slice();
	}
	
	$("#grid-size").val(game.grid_size);
	$("#time-interval").val(game.sim_update_interval);

}


$(function(){
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

	$("#simulation-select").change(function(event){
		$("#simulation-size").text("size: "+simulations.x_size[event.target.selectedIndex] + "*" +simulations.y_size[event.target.selectedIndex]);
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



	//initialize tab wedget
	$("#editor-tabs" ).tabs({
		activate:function(event,ui){
				var newIndex = ui.newTab.index();
				var oldIndex = ui.oldTab.index();
				switch_tab(newIndex);
				clear_tab(oldIndex);
			}

	}); 
	$("#move-to-location").click(function(){
		map.setCenter(new google.maps.LatLng(
			$("#top_left_lat").val(),
			$("#top_left_lng").val()
		));
	});
	$("#set-location").click(function(){
		alert("coding is cool");
	});

	

});
