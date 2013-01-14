var bind = false;
function dot_move(e){
		if(e.pageX>$("#bar").offset().left&&e.pageX<($("#bar").offset().left+$("#bar").width())){
    		$('#dot').css({
       			left:  e.pageX - $("#bar").offset().left
    		});
    	}
		var percent = ($('#dot').offset().left - $("#bar").offset().left)/$("#bar").width();
		var time=get_time(percent);
		$('#time_display').text(Math.floor(time/1000/60) + ":" + Math.floor(time/1000)%60);
}


$('#dot').live('mousedown',function(e){
	bind = true;
	$(document).bind('mousemove', dot_move);
	
	if(in_play)
		pause();
	
});

/*$(document).bind('mouseup',function(e){
	if(bind){
		$(document).unbind('mousemove', dot_move(e));
		var percent = ($('#dot').offset().left - $("#bar").offset().left)/$("#bar").width();
		forward_to(percent);
		bind=false;
	}
	
	if(in_play)
		play(setScrollBar);
});*/

var in_play=false;
$("#play-button").live('click',function(e){
	if(in_play){
		$("#play-button").html("<img src='/img/replay-control/play.png'>");
		in_play=false;
		pause();
	}else{
		$("#play-button").html("<img src='/img/replay-control/pause.png'>");
		in_play=true;
		play(setScrollBar);
	}
	//
});

$("#forward-button").live('click',function(e){
	//need to pause and resume while the replay is in prograss, otherwise the speed change only take 
	//effect after current setTimeout task is finished which might be very slow.
	
	if (speed<128)
		speed=speed*2;
	$("#speed_display").html("x "+speed);	
	
});

$("#backward-button").live('click',function(e){
	
	if (speed>0.24)
		speed=speed/2;
	$("#speed_display").html("x "+speed);
	
});



function setScrollBar(percent){
	$('#dot').css({
       	left: $("#bar").width()*percent
    });
    var time=get_time(percent);
	$('#time_display').text(Math.floor(time/1000/60) + ":" + Math.floor(time/1000)%60);
}



