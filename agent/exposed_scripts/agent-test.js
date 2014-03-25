/*
This is a virtual agent template
usage:

node agent.js [game_id]

it moves an agent along a fix route

*/

var events = require('events');
var RUBY_PORT = 49992;
var game_id=process.argv[2];
var role=process.argv[3];

var players =  [];
var dp = [{lat:52.9521738,lng:-1.1862338},{lat:52.9517213,lng:-1.1845815}];

var Helper = require('../agent_helper');
var helper = new Helper(game_id);
// get a socket io connection to server
var socket = helper.getSocket();

//logout of game when the pragram terminates
var stdin = process.openStdin();
process.on('SIGINT', function () {
  process.exit(0);
});

var SOCKET_IO_ADDRESS = helper.socket_address;
var NODE_JS_ADDRESS = helper.node_address;
var RUBY_ADDRESS = helper.ruby_address;

//handlers and main loop
var game_playing=false;
var truckUpdateID;

function setHandler(){

    //act on events
    socket.on('data', function(data) {
       
        if(typeof data.instructions != "undefined"){
               revInstruction(data.instructions[0]);
        }

        if(typeof data.player != "undefined"){
            //receivePlayerData(data.player);
        }
        
        if(typeof data.textMassage != "undefined"){
            //receiveTextMassage(data.textMassage);
        }
        
        if(typeof data.location != "undefined"){
            //receiveLocationData(data.location);
        }
        
        if(typeof data.request != "undefined"){
            //receiveRequestData(data.request);
        }
        
        if(typeof data.reading != "undefined"){
               // receiveReadingData(data.reading);
        }
            
        if(typeof data.cargo != "undefined"){
                //receiveCargoData(data.cargo);
        }
        
        if(typeof data.cleanup != "undefined"){
                //cleanup(data.cleanup);
        }

        if(typeof data.instructions!= null != "undefined"){
                //executePlan(meetup,path)
        }
    
    });
    
}


//handlers
var frame_id = -1;
function revInstruction(data){
    //var path = ???
    pick_up(data.player_id,data.teammate,path);
}

var pid = null;
function mainloop(id){   
    var p =  players[id]; 
    //push location to server ever half second
    truckUpdateID=setInterval(function(){
        updateTruckLocation(id)
    }, 500);
    
   

    var path = null;
    //setupMovement(id) ;  
     if(id%2 == 0){
         //set initial postion
        p.lat = 52.951317;
        p.lng = -1.185798;
       
        path = [{lat:52.951317,lng:-1.185798},{lat:52.952037,lng:-1.186131},{lat:52.9513161,lng:-1.185404}]; 
    }
    else{
        p.lat = 52.951880;
        p.lng = -1.185696;

        path= [{lat:52.951880,lng:-1.185696},{lat:52.952037,lng:-1.186131},{lat:52.9513161,lng:-1.185404}]; 
    } 

    if(pid == null){
        pickup(id, id+1 , path);
    }
    else{
        pickup(id, id-1 , path);
    }

    pid = id; 
}


function setupMovement(id,path){
    var p =  players[id]; 
    p.path = path;
    p.current_section = 0;
    
    //go along next section when previous section finished
    event.on('section-finish-'+id, function(){
        //console.log(section + " section finish");
        var section  = p.current_section;
        if (p.current_section<path.length-1){
            if(id%2 == 0) {console.log("section:" + p.current_section)};
            moveTruck(p.path[section], p.path[section+1],id);
            p.current_section+=1;
           
        }
        else{
            //cacel movement
            clearInterval(players[id].previousMoveId);
            //flag no movement at the moment
            players[id].previousMoveId = -1;
            //emit
            p.current_section=0;
            event.removeAllListeners('section-finish-'+id);
            event.emit('movement-finish-'+id);
            
        }
    });

    moveTruck(p.path[p.current_section],p.path[p.current_section+1],id);
    p.current_section+=1;
}


function updateTruckLocation(id){
    //sync protection?
    socket.emit('location-push',{"player_id":players[id].user_id,"latitude":players[id].lat,"longitude":players[id].lng,"skill":players[id].skill,"initials":players[id].initials});
    //if(id%2==0) {console.log(id + ":" + players[id].lat + "," + players[id].lng)};
}

/////////////////////////////
//this code control movement of a agent
/////////////////////////////


var MoveEvent=function MoveEvent(){};
MoveEvent.prototype=new events.EventEmitter;
var event= new MoveEvent;

function moveTruck(ori,des,id){
    var speed = 10; //5 m/s
    var p = players[id];

    //if(id%2==0) {console.log("from " +JSON.stringify(ori)+ " to " + JSON.stringify(des));}
    
    helper.api('GET','/agent_utility/distance_between',{lat1:ori.lat,lng1:ori.lng,lat2:des.lat,lng2:des.lng},function(res){
        
        if (res.distance==null){
            return;
        }

        //if(id%2==0){console.log("destance:" + res.distance); }
        //console.log(res.distance);
        //supposed to be finished within distance/speed sec
        var time = res.distance*1000/speed;
        //time interval for each small movement is 0.1 sec, so the whole movement should be finished within time*10 steps
        p.steps= time*10;
    
        var lngPerStep = (des.lng-ori.lng)/p.steps;
        var latPerStep = (des.lat-ori.lat)/p.steps;
        p.count=0;
    
        clearInterval(players[id].previousMoveId);
        players[id].previousMoveId = setInterval(function(){
            moveOneStep(latPerStep,lngPerStep,id);
        },100);
    });
}

function moveOneStep(lat,lng,id) {
        var p = players[id];
        if(p.count<p.steps){
            players[id].lat = players[id].lat+lat;
            players[id].lng = players[id].lng+lng;        
            //console.log(helper.player.lat+","+helper.player.lng);
            p.count+=1;    
        }
        else{
            clearInterval(p.previousMoveId);           
            //notify that a section has be completed
            event.emit('section-finish-'+id);
        }    
}

function startAgents(){
    //join game
    helper.join('agent','a@agent.com','truck',0,'AA', function(p){
        if (p.user_id != null){
            //wait for starting signal 
            /*comnsole.log("wait for starting signal ");
        
            socket.on('data', function(data) {
                if(data.system == "start"){
                    game_playing=true;
                    console.log("start playing");
                
                
                }
            });*/
        
            //initialize
            players[p.user_id] =  p;
            //helper.player=p;
            //setHandler();
            mainloop(p.user_id);
        }
        //console.log(p);
    });
}


setTimeout(startAgents,1000);
setTimeout(startAgents,2000);



function pickup(id1,id2,path){

    event.once('movement-finish-'+id2, function(){
        if(players[id1].previousMoveId == -1){
            dropoff(id1,id2);

        }
    });

    setupMovement(id1,path);
}


function dropoff(id1,id2){
    var p1 = players[id1];
    var p2 = players[id2];

    helper.api('GET','/agent_utility/distance_between',{lat1:p1.lat,lng1:p1.lng,lat2:dp[0].lat,lng2:dp[0].lng},function(res){
        var distance1 = res.distance;
        helper.api('GET','/agent_utility/distance_between',{lat1:p1.lat,lng1:p1.lng,lat2:dp[1].lat,lng2:dp[1].lng},function(res){
            var distance2 = res.distance;
            var d = null
            if(distance1<distance2){ d = dp[0]; }else{ d = dp[1]; }

            var path1 = [{lat:p1.lat,lng:p1.lng},d];
            var path2 = [{lat:p2.lat,lng:p2.lng},d];
            setupMovement(id1,path1);
            setupMovement(id2,path2);
            console.log("begin drop off");
            
        });
    });
}








