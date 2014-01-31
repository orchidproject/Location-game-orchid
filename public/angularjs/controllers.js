var app = angular.module('AtomicOrchidJs',[]);
app.factory("dataService",function(){

	return {};
}).factory("mapService", function(){
	var service = {
		setGameArea:function(){


			var bounds = new google.maps.LatLngBounds();
			$(tasks).each(function(index,value){
				bounds.extend(new google.maps.LatLng(value.marker.getPosition().lat(), value.marker.getPosition().lng()));	
			});	

			//set 
			map.fitBounds(bounds);
			
		},
		moveToTask: function(id){
			var task_id = id;
			if (id==null){
				//random number for demo
				task_id = Math.floor(Math.random()*10)%tasks.length;
			}
			map.panTo(new google.maps.LatLng(tasks[task_id].marker.getPosition().lat(), tasks[task_id].marker.getPosition().lng()));

		},
		renderPlans: function(){
			var task_id = 0;
			$(players).each(function(index,value){
				if(value!=null){
				task_id = Math.floor(Math.random()*10)%tasks.length;
				new google.maps.Polyline ({
					map:map,
					path:[
						tasks[task_id].marker.getPosition(),
						value.marker.getPosition()]
					}); 
				}
			});
		}

	} 
	return service; 

});


app.controller("panelController", function($scope,$timeout,mapService){
	$scope.showChatbox= [false,false];
	$scope.showPlanEditor = [false,false];
	$scope.constraints = [1];
	$scope.loadingIndicator = false;
	$scope.map = mapService;

	$scope.toggleChatbox = function(id){
		if($scope.showChatbox[id])
			$scope.showChatbox[id] = false;
		else 
			$scope.showChatbox[id] = true;
		
	} 

	$scope.togglePlanEditor = function(id){
		if($scope.showPlanEditor[id])
			$scope.showPlanEditor[id] = false;
		else 
			$scope.showPlanEditor[id] = true;

	} 

	$scope.addConstrain = function(){
		$scope.constraints.push({});
	}

	$scope.deleteConstrain = function(){
		$scope.constraints.pop();
	}

	$scope.loadPlan =function(){
		$scope.loadingIndicator = true;	
		$timeout(function(){$scope.loadingIndicator =false; $scope.map.renderPlans() },2000); 

	} 


});
