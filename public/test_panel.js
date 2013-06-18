$(function(){


	$("#btn-setframe").click(function(){
		
		if(isNaN($("#txt-frame").val())){
			alert("frame not a number");
		//fetch frame 
		}else{ 
			$.get("/test/" + GAME_ID+ "/" + $("#txt-frame").val()  + "/getFrame",
				function(data){
					receiveHeatmapData(JSON.parse(data));
				}
			); 
		} 
	});
	$("#btn-fetchplan").click(function(){

	});
});

