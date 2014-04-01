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

var handler_set = false;
function setHandler(){
    var test_count = 0;
    if(!handler_set) { handler_set=true }else{ return; } 
    //act on events
    socket.on('data', function(data) {
       
        if(typeof data.instructions != "undefined"){
               var data = considerInstruction(data.instructions[0]);
               exeInstruction(data);

               console.log("test: "+test_count++);
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
    });
    
}


var rejections = {};
var instruction_count = 0;
function considerInstruction(data){


    if(data.confirmed == 0) return data;

    var chance = 20;
    console.log("count:" + instruction_count + " ratio:" + instruction_count/8);
    if((instruction_count/8) < 1){ chance = 0}
    else if((instruction_count/8) == 1){ chance = 100}
    else if((instruction_count/8) < 2){ chance = 0};
    instruction_count++;

    //if teammate have rejected it.
    if(rejections[data.teammate] != null){
        if(rejections[data.teammate]){
            //reject it
            data.task= -1;
            socket.emit('ack-instruction',{id: data.id , status: 3, player_id:data.player_id});
            delete rejections[data.teammate];
            return data;
        }else{
            return data;
        }
    }

    if(Math.random()*100<chance){
        //reject it
        data.task = -1;
        socket.emit('ack-instruction',{id: data.id , status: 3, player_id:data.player_id});
        //let teammate know this
        rejections[data.player_id] = true;
        return data;
    }

    
    rejections[data.player_id] = false;
    return data;
}

function clearMovement(id, tm){
    if(players[id].previousMoveId != -1 ){
        clearInterval(players[id].previousMoveId);
        players[id].previousMoveId = -1;
    } 
    event.removeAllListeners("section-finish-"+ id);
    event.removeAllListeners("movement-finish-"+ tm);
}

//handlers
var frame_id = -1;
function exeInstruction(data){
    if(data.confirmed == 0) return ;
    console.log("instruction: "+ JSON.stringify(data));
    clearMovement(data.player_id,data.teammate);
    if(data.task == -1) return;

    //var path = ???
    console.log(JSON.stringify(data));
    //insert current location
    data.path.unshift({lat:players[data.player_id].lat,lng:players[data.player_id].lng})
    pickup(data.player_id,data.teammate,data.path);

    //accept
    socket.emit('ack-instruction',{id: data.id , status: 2, player_id:data.player_id});
}

var pid = null;
function mainloop(id){   
    var p =  players[id]; 
    //push location to server ever half second
    truckUpdateID=setInterval(function(){
        updateTruckLocation(id)
    }, 500);
    
   
    p.lat = 52.9521738;
    p.lng = -1.1862338;
    
    /*
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

    pid = id; */
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
            console.log("movement finished");
            
        }
    });

    moveTruck(p.path[p.current_section],p.path[p.current_section+1],id);
    p.current_section+=1;
}


function updateTruckLocation(id){
    
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
    var speed = 2; //1 m/s
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

function startAgents(role,initials){
    //join game
    helper.join('agent','a@agent.com','truck',role,initials, function(p){
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
            p.previousMoveId = -1;
            //helper.player=p;
            setHandler();
            mainloop(p.user_id);
        }
        //console.log(p);
    });
}


setTimeout(function(){
    startAgents(0,'AA');
},1000);



setTimeout(function(){
    startAgents(0,'BB');
},2000);

setTimeout(function(){
    startAgents(1,'CC');
},1000);



setTimeout(function(){
    startAgents(1,'DD');
},2000);

setTimeout(function(){
    startAgents(2,'EE');
},1000);



setTimeout(function(){
    startAgents(2,'FF');
},2000);

setTimeout(function(){
    startAgents(3,'GG');
},1000);



setTimeout(function(){
    startAgents(3,'HH');
},2000);




function pickup(id1,id2,path){
    console.log("begin drop off "+ id1 + " : " + id2) //" path " + JSON.stringify(path1) + ":" + JSON.stringify(path2));
    event.once('movement-finish-'+id2, function(){
        if(players[id1].previousMoveId == -1){
            dropoff(id1,id2);
            console.log(id2 + " wait for " + id1)
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

            console.log("begin drop off "+ id1 + " : " + id2 + " path " + JSON.stringify(path1) + ":" + JSON.stringify(path2));
            
        });
    });
}








