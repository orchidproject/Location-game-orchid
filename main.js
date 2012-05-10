var sys = require('util');
var url = require('url');

// Load the node-router library by creationix
var http = require('./nodelib/node-router').getServer();

var io = require('socket.io').listen(parseInt(process.argv[2]));
var requestClient = require('http');
var fs = require('fs');

//log system 
function write_log(game_id,data){
    var log = fs.createWriteStream('logs/log-'+game_id, {'flags': 'a'});
    var time = new Date();
    data.time_stamp = time.getTime();
    log.write(JSON.stringify(data)+"\n");
    log.end();
}



//-----Http server for pushing information from ruby

var sessionTable = [];
var ackid=0;

http.post("/broadcast", function (request, response) {
    request.content = '';
    request.addListener("data", function(chunk) {
		request.content += chunk;
	});
 
	request.addListener("end", function() {
        var ob=JSON.parse(request.content);
        content=JSON.parse(ob.data);
        content.data["ackid"]=ackid++;
        var channel=content.channel;console.log(channel);
        var users=content.users;
        
        io.sockets.in(channel).emit('data', content.data);
        
        write_log(channel,content.data);
        
        
        //send to indvidual users
        if(users!=null){
        	var user;
        	for(user in users){
        		io.sockets.socket(sessionTable[user]).emit('data', content.data);
        	}
        }
    });
    
    response.simpleText(200, "ok");
});

//-----Http server for replay
http.get("/get_log", function (request, response){
    response.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin':'*'
    });
    var url_parts = url.parse(request.url,true);
    console.log(url_parts.query.game_id);
    if(url_parts.query.game_id!=null){
        var body= fs.readFileSync('logs/log-'+url_parts.query.game_id,'utf8');
        response.write(body);
        response.end();

    }
});


http.post("/push_log", function (request, response){
    request.content = '';
    request.addListener("data", function(chunk) {
		request.content += chunk;
	});
 
	request.addListener("end", function() {
        console.log(request.content);
        var obj=JSON.parse(request.content);
        var time = new Date();
        write_log(obj.game_id+"-"+obj.player_id+"-"+time.getTime(),obj.data);
    });
});

// Listen on port 8080 on localhost
http.listen(process.argv[3], "0.0.0.0");

//work around, cos no geo library exists for node.js. 
/*
var options = {
  host: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST'
};

var req = requestClient.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();*/



//-------------------mysql utility--------------------
var mysql = require('mysql');
var DATABASE = database;
var client = mysql.createClient({
    user: db_username,
    password: db_password
});
client.query('USE '+DATABASE);



function update_location(latitude, longitude, id){
  var query = 'UPDATE players SET latitude='+ latitude + ', longitude='+ longitude + ' WHERE id='+id;
  client.query(
    query
  );
  console.log(query);
}

function get_game_status(game_layer_id,callback){
    if(!game_layer_id){
        return;
    }
    var query = 'SELECT is_active FROM games  WHERE layer_id='+game_layer_id;
    
    client.query(
        query,
        function selectCb(err, results, fields) {
            
            if (err) {
                throw err;
            }
            console.log(query);
            var active=results[0].is_active;
            callback(active);
        }
    );
   
}

function insert_request(request){
    client.query(
    'INSERT INTO requests'
    );
}

function insert_reading(reading){
    client.query(
    'INSERT INTO requests'
    );
}

function insert_cargo(data){
    client.query(
    'INSERT INTO requests'
    );
}




//test
/* client.query(
    'SELECT * FROM players',
    function selectCb(err, results, fields) {
        if (err) {
            throw err;
        }

        console.log(results);
        console.log(fields);
        client.end();
    }*/

//------------------end mysql utility---------------------



io.sockets.on('connection', function (socket) {
  socket.emit('game');
 
  socket.on('game-join', function (data){
  	if (data.channel==null){//support old client
  		socket.join(data);
  		socket.set("channel",data);
  	}else{
    	socket.join(data.channel);
    	socket.set("channel",data.channel);
    }
    
    if (data.id!=null){
    	//sessionTable.push({data.id:socket.transport.sessionid});
    	sessionTable[data.id]=socket.id;
    	console.log('session id recorded ' + data.id + " " + socket.id);
    }
    
    socket.get("channel", function (err, content) {
        console.log('join game channel ' + content);
    });
    
  });
  
  socket.on('ack', function (data) {
  	 console.log('ack received ' + data);
  	 write_log("ack-"+data.channel,data);
  	 
  });
  
  //SINGLE location push
  socket.on('location-push', function (data) {
    
    var channel;
    socket.get("channel", function (err, content) {
        channel=content;
    });
    //console.log(channel);
    
    //save location
    get_game_status(channel,function(is_active){
        //dconsole.log(is_active);
        //if(is_active==0){
        if(true){
            update_location(data.latitude,data.longitude,data.player_id);
            //data["ackid"]=ackid++;
            io.sockets.in(channel).emit('data', {"location":data,"ackid":ackid++});
            write_log(channel,{"location":data,"ackid":ackid});
        
        }
        else{
            console.log("game not active, broadcast blocked");
        }
    });
    
    //test from webview 
    socket.on('message', function (data) {
  	 	console.log('message' + data);
  	});
});
  
  /*
  socket.on('action-push', function (data) {
    console.log(data); 
    
    //store in mysql 
    if (data.type != "undefined"){
        console.log(data.type);
    }
    data.id=1;
    //broadcast 
    io.sockets.in('game_1').emit('data',data);
  });*/
  
});