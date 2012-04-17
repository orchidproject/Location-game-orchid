var playerIconSize = new google.maps.Size(32, 32);
var playerIconOrigin = new google.maps.Point(0,0);
var playerIconAnchor = new google.maps.Point(16, 32);

var taskIcon1 = "/img/task_icon1.png";
var taskIcon2 =  "/img/task_icon2.png";
var taskIcon3 =  "/img/task_icon3.png";
var taskIcon4 = "/img/task_icon4.png";

var medic = "/img/medic.png";
var soldier =  "/img/soldier.png";
var ambulance =  "/img/ambulance.png";
var transporter = "/img/convertible.png";

var chosen_task_type = 0;


function getPlayerIcon(skill) {

	var imageURL = "";
	
    if(skill == 'medic') {
            imageURL = medic;
    }
    else if(skill == 'soldier') {
	    	imageURL = soldier; 
    }
	else if(skill == 'ambulance') {
	    	imageURL = ambulance;
    }
    else if(skill == 'transporter') {
	    	imageURL = transporter;
    }

    var icon = new google.maps.MarkerImage(imageURL, playerIconSize, playerIconOrigin, playerIconAnchor);
	
	return icon;
}

//SHOULD BE LOCATION DATA???////
function receivePlayerData(data) {
	var markerIcon;

   if(typeof data.skill == 'undefined') {
     markerIcon = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/icons/blue-dot.png", playerIconSize, playerIconOrigin, playerIconAnchor); //getPlayerIcon(data.skill);
   } else {
	   markerIcon = getPlayerIcon(data.skill);
   }
	    var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
		var pid = data.player_id;
		//move my highlighting (if necessary)
		//if(pid == $('#user_id').val()) {
		//	setHighlightPosition(new google.maps.LatLng(data.latitude, data.longitude));
		//} else {
		    if(typeof players[pid] == "undefined") {
		        
		        players[pid] = {
		            id: pid,
		            name: data.name,
		            marker: new google.maps.Marker({
		                position: new google.maps.LatLng(data.latitude, data.longitude),
		                map: map,
		                icon: markerIcon,
		                visible: true
		            })
		        };
		    } else {
		        //update 
		        var p = players[pid];
		            p.marker.setPosition(new google.maps.LatLng(data.latitude, data.longitude));
		            p.marker.setIcon(markerIcon);
		    }	        
		
	//        if(typeof players[data.id] == "undefined") {
	//        
	//            players[data.id] = {
	//                id: data.id,
	//                name: data.name,
	//                team: data.team,
	//                points_cache: data.points_cache
	//            };
	//        } else {
	//            var p = players[data.id];
	//            p.team = data.team;
	//            p.points_cache = data.points_cache;
	//        }
		//}   
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

var tasks = [];
function receiveTaskData(task){
		var existing_task=null;
		for (i=0;i<tasks.length;i++) {
			if (tasks[i].id==task.id){
				existing_task=tasks[i];
			}
		}
		
		if(existing_task==null){
			var taskIcon= getTaskIcon(task.type);
			var point = new google.maps.LatLng(task.latitude,task.longitude);
                
    		var marker = new google.maps.Marker({
                	position: point,
                	map: map,
                	icon: taskIcon
        	});
        
        	var the_task={id:task.id,marker:marker};
        
        	tasks.push(the_task);
        }
        else{
        	var new_postion = new google.maps.LatLng(task.latitude,task.longitude);
        	existing_task.marker.setPosition(new_postion);
        }
}


function getTaskIcon(task_type) {

	var imageURL = ""
	if (task_type == 0) {
		imageURL = taskIcon1; 
	}
	else if (task_type == 1) {
		imageURL = taskIcon2;
	}
	else if (task_type == 2) {
		imageURL = taskIcon3;
	}
	else if (task_type == 3) {
		imageURL = taskIcon4;
	}
	
    var icon = new google.maps.MarkerImage(imageURL, playerIconSize, playerIconOrigin, playerIconAnchor);
	
	return icon;
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

