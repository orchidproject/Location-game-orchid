function receivePlayerData(data) {
   
	    var markerIcon;
		var myLatLng = new google.maps.LatLng(data.latitude, data.longitude);
	    if(data.skill == 'A') {
	    	markerIcon = personSkillA;
	    }
	    if(data.skill == 'B') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    if(data.skill == 'C') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    if(data.skill == 'D') {
	    	markerIcon = personSkillA; //TODO: change to appropriate skill icon
	    }
	    	    
	    if(typeof players[data.id] == "undefined") {
	        
	        players[data.id] = {
	            id: data.id,
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
	        var p = players[data.id];
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
   
}



//var GameMap = {
//	fitToRadius: function(radius) {
//	  var center = map.getCenter();
//	  var topMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 0);
//	  var bottomMiddle = google.maps.geometry.spherical.computeOffset(center, radius, 180);
//	  var bounds = new google.maps.LatLngBounds();
//	  bounds.extend(topMiddle);
//	  bounds.extend(bottomMiddle);
//	  map.fitBounds(bounds);
//	},
//
//	goToAddress: function(address) {
//		var geocoder = new google.maps.Geocoder();
//		geocoder.geocode({address: address, bounds: map.getBounds()}, function(response) {
//				if(response.length > 0) {
//					var place = response[0];
//					map.setCenter(place.geometry.location);
//				}
//			}
//		);
//	}
//}
