var G_socket = null;

var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);
var playerIcons = {
	blue: new google.maps.MarkerImage("/img/blue_dot.png", new google.maps.Size(16, 16), playerIconOrigin, new google.maps.Point(8, 8))
}

var taskIcon1 = "task_icon1";
var taskIcon2 =  "task_icon2";
var taskIcon3 =  "task_icon3";
var taskIcon4 = "task_icon4";

var medic = "/img/medic.png";
var soldier =  "/img/soldier.png";
var ambulance =  "/img/firefighter.png";
var transporter = "/img/convertible.png";
var tick = "/img/tick.png";

var chosen_task_type = 0;

var cg = {
	s: function(w,h) {
		return new google.maps.Size(w,h);
	},
	p: function(w,h) {
		return new google.maps.Point(w,h);
	},
	playerImage: function(name, skill) {
		return new google.maps.MarkerImage("/player/"+name[0]+"/"+name[1]+"/"+skill+"/map_icon.png", new google.maps.Size(50 , 58), new google.maps.Point(0,0), new google.maps.Point(10, 30), new google.maps.Size(50 , 58));
	},
	imageSrc: function(name, skill) {
		return "/player/"+name[0]+"/"+name[1]+"/"+skill+"/map_icon.png";
	},
	large_number: function(number){
		return new google.maps.MarkerImage("/img/large_number/" + number + ".png", new google.maps.Size(50 , 58), new google.maps.Point(0,0), new google.maps.Point(10, 30), new google.maps.Size(50 , 58));

	}
	
};

function getPlayerIcon(initials, skill) {

    var icon = cg.playerImage(initials,skill);
	
	return icon;
}


var highlightMarker=null;

function setHighlightPosition(loc) {
	if(highlightMarker==null) {
		highlightImage = "/img/dot-sprite.png";
		highlightMarkerIcon = new google.maps.MarkerImage(highlightImage, playerIconSize, playerIconOrigin, playerIconAnchor);
        highlightMarker = {
	            id: 9999,
	            name: "my_marker",
	            marker: new google.maps.Marker({
	                position: loc,
	                map: map,
	                icon: highlightMarkerIcon,
	                visible: true
	            })
	        };

	}
	
	//highlightMarker.setPosition(loc);
	//now centre the map around me
	//centreMap(loc);
}

function centreMap(loc) {
	$('#map').setCentre();
}


/**
TASK ICONS... 
*/
var dropOffZones = [];
function receiveDropoffpointData(drop){
	point = new google.maps.LatLng(drop.latitude,drop.longitude);
                	
        var circle = new google.maps.Circle({
				center:point,
  				map: map,
  				radius: drop.radius,    
  				fillColor: '#0000FF',
  				strokeColor: '#0000FF',
  				clickable: false
		});

	var marker =  new google.maps.Marker({
				position: point,
				map:map, 
				icon:cg.large_number((drop.id%10))
	});

	dropOffZones.push(circle);
}

function drawInstruction(pid,tid){
	if(players[pid]!=null){
		var p = players[pid];
		var color = '#FFFF00';

		if (p.instruction.status == 3){
			color = '#000000';
		}
		else if(p.instruction.status == 2){
			color = '#FFFFFF';
		}

		var lat = p.marker.getPosition().lat();	
		var lng = p.marker.getPosition().lng();
		if(p.previous_path!=null){
			p.previous_path.setMap(null);
		} 
		if (tid == -1){
			return;	
		}


		var t = findTaskById(tid);
		var lat2 = t.marker.getPosition().lat();	
		var lng2 = t.marker.getPosition().lng();	
		var flightPlanCoordinates = [
		      new google.maps.LatLng(lat, lng),
		      new google.maps.LatLng(lat2, lng2),
		  ];
		  var flightPath = new google.maps.Polyline({
		    path: flightPlanCoordinates,
		    strokeColor: color,
		    strokeOpacity: 1.0,
		    strokeWeight: 4 
		  });

		  p.previous_path = flightPath;
		  flightPath.setMap(map);
	}


}




var tasks = [];
function receiveTaskData(task){


	var existing_task=null;
	for (i=0;i<tasks.length;i++) {
		if (tasks[i].id==task.id){
			existing_task=tasks[i];
		}
	}
	
	
	if(existing_task==null){
		if(task.state == 4) return;
		
		var taskIcon= getTaskIcon(task.type,task.id);
		var point = new google.maps.LatLng(task.latitude,task.longitude);
		if (task.state==2){
			taskIcon=new google.maps.MarkerImage(tick, playerIconSize, playerIconOrigin, playerIconAnchor);
		}
		var drag = false;
		if(test!=null&&test){
			drag=test;
		}	
    	var marker = new google.maps.Marker({
                	position: point,
                	map: map,
                	icon: taskIcon,
					draggable:drag
        });
        
        var the_task={id:task.id,state: task.state, marker:marker};
        
        tasks.push(the_task);
		if(test!=null&&test){
			//setupTaskTest(the_task);
		}
    }
    else{
    		//delete exisiting target when invalidated
			if(existing_task.state == 5) {
				existing_task.marker.setMap(null);
				return;
			}

    		//update both type and location
        	var new_postion = new google.maps.LatLng(task.latitude,task.longitude);
        	existing_task.marker.setPosition(new_postion);
        	
        	if (task.state==2){
				var taskIcon=new google.maps.MarkerImage(
					tick, 
					playerIconSize, 
					playerIconOrigin, 
					playerIconAnchor
				);
				existing_task.marker.setIcon(taskIcon);
				if(existing_task.state!=2){
					setTimeout(function(){
						existing_task.marker.setMap(null);
					},5000);
				}
			}

	        else if(task.state != 2){
				var taskIcon= getTaskIcon(task.type,task.id);
				existing_task.marker.setIcon(taskIcon); 
			}

			existing_task.state = task.state;

        }
           
        //handle task status
        handleTaskStatus(task);
       
}


function getTaskImage(task_type) {
	var imageURL = ""
	if (task_type == 0) {
		imageURL = taskIcon1; 
	}
	else if (task_type == 1) {
		imageURL = taskIcon2;
	} else if (task_type == 2) {
		imageURL = taskIcon3;
	}
	else if (task_type == 3) {
		imageURL = taskIcon4;
	}
	
	return imageURL;
}

 
function getTaskIcon(task_type,task_id) {

	var imageURL=getTaskImage(task_type);
	//var initials = String.fromCharCode(65 + task_id/26) + String.fromCharCode(65+ task_id%26); 	
	var initials = (Math.floor((task_id/10)%10) + "" + task_id%10); 	
        var icon = cg.playerImage(initials,imageURL);  
	return icon;
}

//SHOULD BE LOCATION DATA???////
function receivePlayerData(data) {
	var markerIcon;
		
	var userID=$("#user_id").val();
		
	var pid = data.player_id;
		
		
	if (userID!=pid){
		markerIcon = getPlayerIcon(data.initials,data.skill);
	}else{
		//an icon for player itself
		markerIcon = playerIcons.blue;
	}
		
		
	if(typeof players[pid] == "undefined") {
		var drag = false;
		if(test!=null&&test){
				drag = test;
		}

		players[pid] = {
		            id: pid,
		            skill: data.skill,
		            initials: data.initials,
		            name: data.name,
		            marker: new google.maps.Marker({
		                position: new google.maps.LatLng(data.latitude, data.longitude),
		                map: map,
				draggable: drag,
		                icon: markerIcon,
		                visible: true 
		            })
		};
			
		if(test!=null&&test){
			setupTest(pid);
		}
	
	} else {
		//update 
		var p = players[pid];
		p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude)); 

		if(test!=null&&test){
			p.marker.setIcon(markerIcon);
		}

		//if(replay){ 
			if(p.instruction!=null){
				drawInstruction(p.id,p.instruction.task);
			}	
		//}
	}	
		
}


var setupTest = function(pid){
	google.maps.event.addListener(players[pid].marker, "dragend", 
		function(event) {
			var lat = event.latLng.lat();
			var lng = event.latLng.lng();
			players[pid].marker.setIcon(getPlayerIcon("00","dead"));	
			
			G_socket.emit("location-push", 
			{  

					  player_id: players[pid].id,
					  latitude:lat, 
					  longitude:lng, 
					  skill: players[pid].skill, 
					  initials: players[pid].initials

			});

			return false;
				//alert(JSON.stringify(event));

		});
}





var GameMap = {
	fitToRadius: function(radius) {
	  var center = map.getCenter();
	  var topMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 0);
	  var bottomMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 180);
	  var bounds = new google.maps.LatLngBounds();
	  bounds.extend(topMiddle);
	  bounds.extend(bottomMiddle);
	  map.fitBounds(bounds);
	}
}


//new model based implementation
function drawTask(task){
	//dynamic attribute including location and task state
	//state = 1:active 2:inactive
	var taskIcon;
	var point = new google.maps.LatLng(task.latitude,task.longitude);
		
	if (task.state==2){
		taskIcon = new google.maps.MarkerImage(tick, playerIconSize, playerIconOrigin, playerIconAnchor);
	}
	else{
		taskIcon = getTaskIcon(task.type,task.id); 

	}	
	
	if (task.marker == null){
     		task.marker = new google.maps.Marker({
                	position: point,
                	map: map,
                	icon: taskIcon
        	});
       
        }
        else{
        	task.marker.setPosition(point);
        }
}

function drawDpZone(dpZone){
	//dpzone is static
	point = new google.maps.LatLng(dpZone.latitude,dpZone.longitude);
        if(dpZone.marker == null){        	
		dpZone.marker = new google.maps.Circle({
				center:point,
  				map: map,
  				radius: dpZone.radius,    
  				fillColor: '#0000FF',
  				strokeColor: '#0000FF',
  				clickable: true 
		});
	}

}

var G_getPixelFromMap = function(latlng){
	var overlay = new google.maps.OverlayView();
	overlay.draw = function() {};
	overlay.setMap(map);
	var p = overlay.getProjection();
	p = overlay.getProjection();
	return p.fromLatLngToContainerPixel(latlng); 

}

var G_fcount
var G_d3HighLight = function(a,b){
	var width = 300;
	var height = 300;
	var inner = 0;
	var final_radius = 70;

	var arc = d3.svg.arc()
    .innerRadius(inner)
    .outerRadius(inner+2)
    .startAngle(0) //converting from degs to radians
    .endAngle(2*Math.PI); //just radians

    var arc_generator = d3.svg.arc()
    .innerRadius(function(d){ 
    	return d;})
    .outerRadius(function(d){ 
    	return d+2;})
    .startAngle(0) //converting from degs to radians
    .endAngle(2*Math.PI); //just radians


    var c = G_fcount++;
	d3.select("html").append("svg")
	.attr("id","fsvg-"+c)
	.attr("style", "width:"+width+"px;height:"+height+"px;position:absolute;z-index:999999999;left:"+(a-width/2)+"px;top:"+(b-height/2)+"px")
	.append("path").data([1])
	.attr("transform", "translate("+(width/2)+","+(height/2)+")")
	.attr("d",arc).transition().duration(500)
	.attrTween("d",function(){
		var i = d3.interpolate(0,final_radius);
		return function(t){
			return arc_generator(i(t));
		}
	})
	.each("end",function(){ d3.select("#fsvg-"+c).remove();} );

}


setInterval(function(){
				
	d3.selectAll(".flickable").attr("style", "opacity:1")
	.transition().duration(500).attr("style", "opacity:0.5")
	.transition().duration(500).attr("style", "opacity:1");
},1000);

setInterval(function(){
				
	d3.selectAll(".attention").attr("style", "background-color: white")
	.transition().duration(500).attr("style", "background-color: red")
	.transition().duration(500).attr("style", "background-color: white");

},1000);
