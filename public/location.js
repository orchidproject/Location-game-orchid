/**
 * 
 */

var nav;
var watchID;

function listenForPositionUpdates() {
  if (nav == null) {
      nav = window.navigator;
  }
  if (nav != null) {
      var geoloc = nav.geolocation;
      if (geoloc != null) {
          watchID = geoloc.watchPosition(successCallback, errorCallback, 
        		  {enableHighAccuracy:true,
        	  maximumAge:60000,
        	  timeout:120000});
      }
      else {
          alert("Geolocation API is not supported in your browser");
      }
  }
  else {
      alert("Navigator is not found");
  }
}

function successCallback(position)
{
	alert('debug: location detection successful');
//   setText(position.coords.latitude, "latitude");
//   setText(position.coords.longitude, "longitude");
	var lat = position.coords.latitude;
	var lng = position.coords.longitude;
	if(position.coords.accuracy < 30) {
		locationUpdate($('#user_id').val(), lat, lng);
	} else {
		//ignore the position
	}
}

function errorCallback(e)
{
	alert("Problem getting location. If problem persists, please alert a coordinator of the simulation. Thanks!");
}

function clearWatch(watchID) {
    window.navigator.geolocation.clearWatch(watchID);
}