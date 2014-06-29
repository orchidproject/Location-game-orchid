#the code for development and testing 
require 'uri'
require 'net/http'
require "./lib/plan-handler.rb"


class Controller < Sinatra::Base 


 get '/test/instruction/:player_id/' do
	ins = Instruction.last(:player_id => params[:player_id])
	status = nil
	if (ins.status == 1)	
		status = "waiting for response"
	elsif (ins.status == 2)
		status = "accepted"
	end 

	
	return "latest instruction for player(id "+  params[:player_id] + "): " + status 
 end 

 get '/test/instructionid/:id/' do
	ins = Instruction.get(params[:id])
	status = nil
	if (ins.status == 1)	
		status = "waiting for response"
	elsif (ins.status == 2)
		status = "accepted"
	end 


	return "latest instruction for (id "+  params[:id] + "): " + status 
 end

 post '/test/:game_id/updateTask' do
	@agent = PlanHandler.instances(params[:game_id].to_i)	
	t = Task.get(params[:id])
	t.latitude = Float(params[:lat])
	t.longitude = Float(params[:lng])
	t.save
	data = agentSnapshot(params[:game_id],0,"update")
 	res = @agent.updateSession(data.to_json)	
	
	t.broadcast(socketIO)
	{:sent=> data, :result => res}.to_json
 end 

post '/test/:game_id/:frame/fetchplan' do
	

	#the final test 
	if($simulations[params[:game_id].to_i]!=nil )
		frame =	$simulations[params[:game_id].to_i].getTimeIndex(Time.now)
		
	else
		frame = params[:frame].to_i	
	end 

	time1 = Time.now	
	@agent = PlanHandler.instances(params[:game_id].to_i)	
	data = agentSnapshot(params[:game_id],frame,"fetch")
	keeps = JSON.parse(request.body.read)
	data = keepAssignments(data,keeps)
	
	#append reject info 
	#data["rejections"] = JSON.parse(params[:rejections]) 	
	
	res = @agent.loadPlan(data.to_json)	
	time2 = Time.now

	puts res
	#------------------------processing-------------------------
	processResponse(params[:game_id], res , keeps)	

	#parse json
	{:sent=> data, :plan => JSON.parse(res)}.to_json

 end 

 def keepAssignments(data,keeps)
 	#two nested loops
 	keeps.each do |a|
 		if a["keep"] == true 
 			puts "yes"
 			task = nil
 			data[:state][:tasks].each do |t|
 				if t[:id] == a["task_id"]
 					t["status"] = 2 
 					task = t
 				end
 			end 

 			to_delete = []
 			data[:state][:players].each do |p|
                if p[:id].to_i == a["player1"].to_i or p[:id] == a["player2"].to_i
 					puts "keep compare marched"
 					to_delete << p
 				end
 			end

 			to_delete.each do |d|
 				data[:state][:players].delete(d)
 			end
 		end
 	end 

 	return data
 end 

 post '/game/:game_id/confirm_plan' do 
 	#store into database
 	#compare before and after
 	#stream changed part
 	data = request.body.read
 
 	processConfirmedResponse(params[:game_id],data)

 end 

 get '/test/:game_id/snapshot' do
	(snapshot Game.get(params[:game_id]), false ).to_s
 end 

 get '/test/fetchplan' do
	time1 = Time.now	
	res = PlanHandler.new.load 1
	time2 = Time.now
	#parse json
	p = Game.get(4).plans.create 
	resJson = JSON.parse(res) 

	resJson.each  do |frame| 
		
	    new_frame = p.frames.create(:count=> frame["time_frame"]) 	
	    frame["players"].each do |player|
            if player["group"] == nil
			puts "group null, abort <--------------------------------"
	 		next 	
		    end 

		    ins= new_frame.instructions.new(
				:group => player["group"].to_s,
				:task_id => player["task"],
				:player_id => player["id"],
				:next_x => player["next_x"],
				:next_y => player["next_y"],
				:action => player["action"]
			)	
		    #compare the data
		    #is it guarantee to be the latest?
		    last_instruction = Instruction.last(:player_id => player["id"])
		    if last_instruction&&!last_instruction.equals(ins)
			ins.save
			puts "instruction not same, saved <-------------------------" 
		    elsif !last_instruction
			puts "first plan, saved < -------------------------------"
			ins.save
		    else 
			new_frame.instructions.delete(ins)
			puts "same instruction abort <-----------------------------"
		    end 
	    end 
	end
	
	p.notifyPlayers socketIO 	
end 

 get '/test/:game_id/:frame_id/getFrame' do 
	game = Game.get(params[:game_id]) 
	$simulations[game.layer_id] ||= Simulation.new("./cloud/"+game.simulation_file, 
		game.sim_lat, 
		game.sim_lng, 
		game.grid_size, 
		Time.now, 
		game.sim_update_interval)
	
	frame = $simulations[game.layer_id].getIndexedFrame(params[:frame_id].to_i)
        frame.to_json
end 

 get '/test/fetchplanonly' do
	time1 = Time.now	
	res = PlanHandler.new.load 1
	time2 = Time.now
	(time2-time1).to_s+" seconds result" + res
 end

 get '/test/:game_id/fetchplanfake' do 
	time1 = Time.now	
	res = File.read('./fakePlan.json') 
	time2 = Time.now
	#parse json
	p = Game.get(params[:game_id]).plans.create 
	resJson = JSON.parse(res) 

	resJson.each  do |frame| 
		
	    new_frame = p.frames.create(:count=> frame["time_frame"]) 	
	    frame["players"].each do |player|
		    puts "group is : " + player["group"].to_s 
		    if player["group"] == nil  
			puts "group null, abort <------------------------"
	 		next 	
		    end 

		    ins= new_frame.instructions.new(
			:group => player["group"].to_s,
			:task_id => player["task"],
			:player_id => player["id"],
			:next_x => player["next_x"],
			:next_y => player["next_y"],
			:action => player["action"]
			)	
		    #compare the data
		    #is it guarantee to be the latest?
=begin
		    last_instruction = Instruction.last(:player_id => player["id"])
		   if last_instruction&&!last_instruction.equals(ins)
			ins.save
			puts "instruction not same, saved <-------------------------" 
		    elsif !last_instruction
			puts "first plan, saved < -------------------------------"
			ins.save
		    else 
			new_frame.instructions.delete(ins)
			puts "same instruction abort <-----------------------------"
		    end 
=end 
		ins.save 
	    end 
	end

	p.notifyPlayers socketIO 	
	(time2-time1).to_s+" seconds result" + res

 end 

 def processConfirmedResponse(game_id,res)
 	resJson = nil
 	begin
		resJson = JSON.parse(res) 
	rescue 
		puts "plan pause error"
		return
	end

	g = Game.get(game_id)
	p = g.confirmed_plans.create 

	#plan_id is for get around the bug
	puts resJson.to_json
	new_frame = p.frames.create(:count=> -1,:plan_id => 0) 
	occupied_players = []

	resJson["plan"].each  do |assignment| 
		#add task location anyway
		path1 = assignment["path1"]
		path2 = assignment["path2"]
		if assignment["task_id"] != -1
			t = Task.get(assignment["task_id"])
			if path1!=nil 
				path1 << {:lat => t.latitude,:lng => t.longitude}
			else 
				path1 = [{:lat => t.latitude,:lng => t.longitude}]
			end

			if path2!=nil
				path2 << {:lat => t.latitude,:lng => t.longitude}
			else
				path2 = [{:lat => t.latitude,:lng => t.longitude}]
			end
		end

		ins1= new_frame.instructions.new(
			:group => [assignment["player1"], assignment["player2"]].to_json,
			:task_id => assignment["task_id"],
			:player_id => assignment["player1"],
			:next_x => -1 ,
			:next_y => -1 ,
			:action => "go",
			:path => path1 == nil ? nil : path1.to_json
		)

		ins2= new_frame.instructions.new(
			:group => [assignment["player1"], assignment["player2"]].to_json,
			:task_id => assignment["task_id"],
			:player_id => assignment["player2"],
			:next_x => -1 ,
			:next_y => -1 ,
			:action => "go",
			:path => path2 == nil ? nil : path2.to_json
		)

		occupied_players << assignment["player1"]
		occupied_players << assignment["player2"]

		
		compareInstructions g, new_frame, ins1
		compareInstructions g, new_frame, ins2
	end

	#after the loop, find out idle player
	idle_players = g.players.all(:id.not => occupied_players)

	idle_players.each do |i|
		ins = new_frame.instructions.new(
			:group => [],
			:task_id => -1,
			:player_id => i.id,
			:next_x => -1 ,
			:next_y => -1 ,
			:action => "stop",
			:path => [].to_json
		)
		compareInstructions g, new_frame, ins
	end


	p.notifyPlayers socketIO
	"updated"
 end 

 def compareInstructions(g,f,ins)
 	#if it is same then, do not save 
 	#compare the data
	#is it guarantee to be the latest?
	last_instruction = g.confirmed_plans.frames(:confirmed_plan_id.gt =>0).instructions.last(:player_id => ins.player_id)
	
	if last_instruction&&!last_instruction.equals(ins)
		ins.save
		puts "instruction not same, saved <-------------------------" 
	elsif last_instruction == nil
		puts "first plan, saved < -------------------------------"
		ins.save
	else 
		f.instructions.delete(ins)
		puts "delete <-----------------------------"
	end 

 end 

 def processResponse(game_id,res,keeps) 
	begin
		resJson = JSON.parse(res) 
	rescue 
		puts "plan pause error"
		return
	end

	g = Game.get(game_id)
	p = g.plans.create 
	if(resJson["status"] == "error" )
		 
		 return
	end 

	if(resJson["plan"]==nil)
		puts "error no plan attribute"
		return	
	end	
puts resJson["plan"]
	resJson["plan"].each  do |frame| 
		#alright, this will be a bit confusing. the required false for Old DM is not working , so confirmed_plan_id has to be set a value.
		#since index in DB start from 1 anyway, why not use 0 instead of null? cool, done
	    new_frame = p.frames.create(:count=> frame["time_frame"],:confirmed_plan_id => 0) 	
	 
	    frame["players"].each do |player|
			
			if player["task"] == -1 || player["group"] == nil  
				player["group"] == "" 
			end 
          

			coord_path = [] 
			if player["path"] != nil 
				player["path"].each do |point|
					coord_path << cell_to_coords(point[0],point[1],g)
				end 
			end

			#add task location anyway
			#if player["task"] != -1
				#t = Task.get(player["task"])
				#coord_path << {:lat => t.latitude,:lng => t.longitude}
			#end

			ins= new_frame.instructions.new(
				:group => player["group"].to_json,
				:task_id => player["task"],
				:player_id => player["id"],
				:next_x => player["next_x"],
				:next_y => player["next_y"],
				:action => player["action"],
				:path => coord_path.to_json #serialze it to json 
			)	

			ins.save
			#compare the data
			#is it guarantee to be the latest?
=begin
			last_instruction = Instruction.last(:player_id => player["id"])
			if last_instruction&&!last_instruction.equals(ins)
				ins.save
				puts "instruction not same, saved <-------------------------" 
			elsif !last_instruction
				puts "first plan, saved < -------------------------------"
				 ins.save
			else 
				new_frame.instructions.delete(ins)
				puts "same instruction abort <-----------------------------"
			end 
=end
			keeps.each do |a|
				if(a["keep"] == true)
				ins= new_frame.instructions.new(
					:group => [a["player1"],a["player2"]].to_json,
					:task_id => a["task_id"],
					:player_id => a["player1"],
					:next_x => 0,
					:next_y => 0,
					:action => "go",
					:path => a["path1"].to_json #serialze it to json 
				)	

				ins.save

				ins= new_frame.instructions.new(
					:group => [a["player1"],a["player2"]].to_json,
					:task_id => a["task_id"],
					:player_id => a["player2"],
					:next_x => 0,
					:next_y => 0,
					:action => "go",
					:path => a["path2"].to_json #serialze it to json 
				)	

				ins.save
				end
			end


		end 
	end
	
	p.notifyPlayers socketIO
end 





 get '/test/task' do

        socketIO.broadcast(
      	 { 
            :channel=> params["game_id"],     
      		:data=>{
      					  
      		  :task=>{
             	:id => params["id"],
             	:type=>params["type"],
			 	:requirement=>params["requirement"],
             	:description=> "",
             	:longitude => params["long"],
             	:latitude => params["lat"],
			 	:state => params["status"],
			 	:players => params["players"]
			  }
			}
         }.to_json)
  end 

  get '/migrate' do
        DataMapper.auto_migrate!
  end 
  
  get '/game/:game_id/convertCoords' do
	game= Game.get(params[:game_id])
	sim = Simulation.new("cloud/simulation_data_03.txt", 
        game.sim_lat, 
        game.sim_lng, 
        8, 
        Time.now, 
        0.2)
	data=File.read("game_state.txt")
	data=JSON.parse(data)
	data["tasks"].each do |t| 
		result =  sim.getGridCoord(Float(t["latitude"]),Float(t["longitude"]))

		t["x"] = result[:x]
		t["y"] = result[:y]
		
	end 
	data["players"].each do |p| 
		result =  sim.getGridCoord(Float(p["latitude"]),Float(p["longitude"]))

		p["x"] = result[:x]
		p["y"] = result[:y]
		
	end 

	data["dropoffpoints"].each do |d|
		result = sim.getGridCirclePresentation(
			Float(d["latitude"]),
			Float(d["longitude"]),
			Float(d["radius"]))
		d["x-center"]=result[:x]
		d["y-center"]=result[:y]
		d["grid-radius"]=result[:radius]
	end  

	file = File.open("revised_game_state.txt", "w")
	file.write(data.to_json) 
	data.to_json
  end 
	
  def agentSnapshot(game_id,sec,action)
	#data should be a ruby hash, comply to game state format
	game= Game.get(game_id)


    $simulations[game.layer_id] ||= Simulation.new("./cloud/"+game.simulation_file, 
        game.sim_lat, 
        game.sim_lng, 
        game.grid_size, 
        Time.now, 
        game.sim_update_interval)

	#if game not begin, time frame should be always be 0
	if game.is_active == -1
		$simulations[game.layer_id].resetStart(Time.now)
	end

	sim = $simulations[game.layer_id]
	

	if action == "init"
		data = snapshot(Game.get(game_id), false,"init")
		data[:tasks].each do |t| 
			result =  sim.getGridCoord(Float(t[:latitude]),Float(t[:longitude]))

			t["x"] = result[:x]
			t["y"] = result[:y]
		
		end
		data[:dropoffzones].each do |d|
			result = sim.getGridCirclePresentation(
				Float(d[:latitude]),
				Float(d[:longitude]),
				Float(d[:radius]))
			d["x-center"]=result[:x]
			d["y-center"]=result[:y]
			d["grid-radius"]=result[:radius]
		end
		data[:skills] = JSON.parse(File.read("./skill_mapping.txt"))	
		data[:session_id] = game_id 
		response = data
	elsif action == "fetch"
		
		data = snapshot(Game.get(game_id), false,"fetch")
		skills  =  [
			{
            	"id" => 0,
            	"name" => "medic",
            	"task_types" => [1,2]
        	},
        	{
            	"id" => 1,
            	"name" => "firefighter",
            	"task_types" => [2,3]
        	},
        	{
            	"id" => 2,
            	"name" => "soldier",
            	"task_types" => [0,3]
        	},
        	{
            	"id" => 3,
            	"name" => "transporter",
            	"task_types" => [0,1]
        	}
    	]

		data[:players].each do |p| 
			result =  sim.getGridCoord(Float(p[:latitude]),Float(p[:longitude]))
			p.delete(:latitude)
			p.delete(:longitude)
			p["x"] = result[:x]
			p["y"] = result[:y]
		
		end 
		data[:tasks].each do |t| 
			result =  sim.getGridCoord(Float(t[:latitude]),Float(t[:longitude]))
			t.delete(:latitude)
			t.delete(:longitude)
			t["x"] = result[:x]
			t["y"] = result[:y]
			t["status"] = t[:state]	
			
		end
		response = { 
			:time_frame => sec, 
			:session_id => game_id, 
			:rejections => [], 
			:step =>1,
			:skills => skills,
			:state => checkCoords(data,game,sim)  
		}
		
		response = appendRejections(response,game,sec)

	elsif action == "update"
		data = snapshot(Game.get(game_id),false,"update")
		data[:tasks].each do |t| 
			result =  sim.getGridCoord(Float(t[:latitude]),Float(t[:longitude]))

			t["x"] = result[:x]
			t["y"] = result[:y]
		
		end
		data[:session_id] = game_id
	
		response = data	
	end 

	response
  end 
 
  def appendRejections(data,game,frame)
	data["rejections"] = []
	puts "-----------------------append rejections---------------------"
	game.plans.frames(:count.gt => frame-10).instructions(:status.gte => 3).each do  |ins|
		data["rejections"]<<{:player=> ins.player_id ,:task => ins.task_id, :duration=> 1}
		puts "-----------------------find rejections---------------------"
		puts ins.status.to_s + " "	
	end 

	return data
  end 
  def checkCoords(data,game,sim)
	terrains = JSON.parse(game.terrains)
	
	data[:players].each do |p|
		puts "------------------------------converting------------------------------"
		isOnMap = (p["x"] <= sim.x_size&& p["x"] >= 0 && p["y"] <= sim.y_size && p["y"]>= 0)
		isAccessible = (terrains[p["x"]]== nil || 
				terrains[p["x"]][p["y"]]== nil || 
				terrains[p["x"]][p["y"]] == 0)
 
		if(!isOnMap)
			point =  getLegalPoint(p["x"], p["y"], (sim.y_size/2).floor, (sim.x_size/2).floor,terrains)
			p["x"] = point[0]
			p["y"] = point[1]
			
			player = Player.get(p[:id])
			player.update(:x=> point[0], :y => point[1])	

		elsif(!isAccessible)
			player = Player.get(p[:id])
			if(player.x == nil || player.y == nil)
				point = getLegalPoint(p["x"], p["y"], (sim.y_size/2).floor, (sim.x_size/2).floor,terrains)
			else
				point = getLegalPoint(p["x"], p["y"], player.x , player.y ,terrains)
			end

			p["x"] = point[0] 
			p["y"] = point[1]
			player.x = point[0] 
			player.y = point[1] 
			player.save	
		end 			
	end	
	return data
  end 

  def getLegalPoint(x1,y1,x2,y2,terrains) 
	fx = x1
	fy = y1
	while( fx <0 || fy<0 || terrains[fx] == nil || terrains[fx][fy] == nil ||terrains[fx][fy]!=0)
		
		if(fx<x2)	
			fx += 1	
		else
			fx -= 1
		end	

		if(fy<y2)	
			fy += 1	
		else
			fy -= 1
		end
			end
	return fx,fy
  end 

  get "/test/validate/instruction/:layer_id/" do
	result = []
	Game.get(params[:layer_id]).plans.frames.instructions.all.each do |instruction| 
		if !instruction.validate
			result << instruction.output
		end 
	end 
	result.to_json
  end  
  get "/test/all/instruction/:layer_id/" do
	result = []
	Game.get(params[:layer_id]).plans.frames.all.each do |f| 
		result << f.output
	end 
	result.to_json
  end


end 

