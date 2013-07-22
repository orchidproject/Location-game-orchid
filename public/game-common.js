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
		return new google.maps.MarkerImage("/player/"+name[0]+"/"+name[1]+"/"+skill+"/map_icon.png", new google.maps.Size(30 , 30), new google.maps.Point(0,0), new google.maps.Point(10, 30), new google.maps.Size(30 , 30));
	},
	imageSrc: function(name, skill) {
		return "/player/"+name[0]+"/"+name[1]+"/"+skill+"/map_icon.png";
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
			
		var taskIcon= getTaskIcon(task.type,task.id);
		var point = new google.maps.LatLng(task.latitude,task.longitude);
		if (task.state==2){
			taskIcon=new google.maps.MarkerImage(tick, playerIconSize, playerIconOrigin, playerIconAnchor);
		}
    		var marker = new google.maps.Marker({
                	position: point,
                	map: map,
                	icon: taskIcon,
			draggable:true
        	});
        
        	var the_task={id:task.id,marker:marker};
        
        	tasks.push(the_task);
		if(test!=null&&test){
			setupTaskTest(the_task);
		}
        }
        else{
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
		}

	        else if(task.state == 1 && test!=null&&test){
			var taskIcon= getTaskIcon(task.type,task.id);
			existing_task.marker.setIcon(taskIcon); 
		}

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
		        
		        players[pid] = {
		            id: pid,
		            skill: data.skill,
		            initials: data.initials,
		            name: data.name,
		            marker: new google.maps.Marker({
		                position: new google.maps.LatLng(data.latitude, data.longitude),
		                map: map,
				draggable: true,
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
		}	
		
		
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
        	task.marker.setPosition(taskIcon);
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
