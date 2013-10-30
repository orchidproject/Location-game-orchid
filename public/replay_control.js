var bind = false;



function VideoControl(main,max){
	this.current_time=0;
	this.max_time=max;
	this.playing = false;
	this.videos = [];
	this.offSets =  [];
	this.volumes = [];

	this.hideVideos = function(){
		var main = this;
		$(this.videos).each(function(index,value){
			$(value).hide();
		});
	}

	this.setVideo =  function(video,offSet,callback){
		this.videos.push(video);
		this.offSets.push(offSet);
		callback(this.videos, this.offSets);
	};	
		
	this.setTime = function(time){
		var offSets = this.offSets;
		this.current_time = time;
		var ct = this.current_time;
		 
		$(this.videos).each(function(index,value){
			value[0].currentTime = parseInt(offSets[index].val()) + ct;
		});

	}

	this.play = function(callback){
		var offSets = this.offSets;
		var ct = this.current_time;
		$(this.videos).each(function(index,value){
			if(offSets[index]!=null&&!isNaN(offSets[index].val())){
				value[0].currentTime = parseInt(offSets[index].val()) + ct;
				value[0].play();
				return true;
			}
			else{
				alert("check offsets");
				return false;
			}
		});	
		this.playing = true;
	}

	this.pause= function(){
		$(this.videos).each(function(index,value){
			value[0].pause();
		});	
		this.playing =false;
	}

 }

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

//max time shall be get from log file
var control = new VideoControl(3600);


var in_play=false;
$("#play-button").live('click',function(e){
	if(in_play){
		$("#play-button").html("<img src='/img/replay-control/play.png'>");
		in_play=false;
		pause();
		control.pause();
	}else{
		$("#play-button").html("<img src='/img/replay-control/pause.png'>");
		in_play=true;

		//test value
		var value=0
		play(slider_callback);

		control.play();
	}
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



