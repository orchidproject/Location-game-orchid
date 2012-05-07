/*


A not yet finished helper class for agent.

but it is able to support agent tamplate (agent.js) now

it deal with socket.io connection, game join and http api request
*/


var requestClient = require('http');
var events = require('events');
var client = require('socket.io-client');

Helper.prototype = new events.EventEmitter;

Helper.prototype.getSocket = function(){
    //should be a singleton
    if(typeof this.socket == 'undefined'){
        this.socket = client.connect(this.socket_address, {
            transports: ['websocket', 'flashsocket', 'htmlfile']
        });
        var so = this.socket;
        var game_id=this.game_id;
        so.on('game', function(data) {
            so.emit('game-join', game_id);
        });
    

        so.on('data', function(data) {
            console.log(data);
        });
        
        console.log(this.game_id);
    }
    
    return so;

}
 

Helper.prototype.join = function join(name,email,team,role_id,initials,callback){
    var content="name="+name+"&email="+email+"&team="+team+"&role_id="+role_id+"&initials="+initials;
    var length=content.length;
    console.log('parsed: ' + this.ruby_address);
    var options = {
        host: this.ruby_address,
        port: this.ruby_port,
        path: '/game/'+this.game_id+'/join',
        method: 'POST',
        headers:{"Content-type":"application/x-www-form-urlencoded",'Content-Length':length}
        
    };

    var req = requestClient.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('game join status: ' + chunk);
            player=JSON.parse(chunk);
            player.initials=initials;
            callback(player);
        });
    });
    
    req.write(content);
    req.end();
}

Helper.prototype.api = function api(method,url,parameters,callback){
    //alert:post method have not been implemented


    var options = {
        host: this.ruby_address,
        port: this.ruby_port,
        method: method
    };
    
    if (method=="GET")
    {
        //set parameters
        query="?";
        
        for (var key in parameters){
            query=query+key+"="+parameters[key]+"&"
        }
        options.path=url+query;
        
    }
    else if(method=="POST"){
        options.headers={"Content-type":"application/x-www-form-urlencoded",'Content-Length':length};
        options.path=url;
        //set parameters
    }

    var req = requestClient.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            
            var result=JSON.parse(chunk);
            console.log('BODY: ' + result);
            callback(result);
        });
    });
    
    req.end();
}

Helper.prototype.pullGameStatus = function pullGameStatus(){
    //not implemented yet 

}



function Helper(game_id){
    //this.socket_address='http://holt.mrl.nott.ac.uk:49991';
    //this.ruby_address='holt.mrl.nott.ac.uk';
    
    this.socket_address='http://localhost:49991';
    this.ruby_address='localhost';
    this.ruby_port=49992;
    this.player=new Object;
    this.game_id=game_id;
    
	this.socketAddress=this.socket_address;
	this.nodeAddress='http://localhost:8080';
	this.rubyAddress=this.ruby_address;
	
    //this.socket=new Socket(socket_address);
}

module.exports=Helper;
