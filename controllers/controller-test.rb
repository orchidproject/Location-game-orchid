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

 get '/test/:game_id/fetchplan' do
	#the final test 
	time1 = Time.now	
	gameState = agentSnapshot(params[:game_id],0,snapshot(Game.get(params[:game_id]), false))
	res = PlanHandler.new.load 1, gameState
	time2 = Time.now
	#parse json
	res
=begin
	resJson = JSON.parse(res) 
	p = Game.get(params[:game_id]).plans.create 

	resJson.each  do |frame| 
		
	    new_frame = p.frames.create(:count=> frame["time_frame"]) 	
	    frame["players"].each do |player|
		    puts "group is : " + player["group"].to_s 
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
	(time2-time1).to_s+" seconds result" + res

=end
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
		    puts "group is : " + player["group"].to_s 
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
	(time2-time1).to_s+" seconds result" + res
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

 get '/test/fetchplanfake' do 
	time1 = Time.now	
	res = File.read('./fakePlan.json') 
	time2 = Time.now
	#parse json
	p = Game.get(4).plans.create 
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
  end 
	
  def agentSnapshot(game_id,sec,data)
	#data should be a ruby hash, comply to game state format
	game= Game.get(game_id)

	#TODO not creating new instance is not efficient
	sim = Simulation.new("cloud/simulation_data_03.txt", 
		game.sim_lat, 
		game.sim_lng, 
		8, 
		Time.now, 
		0.2)

	puts data
	data[:tasks].each do |t| 
		result =  sim.getGridCoord(Float(t[:latitude]),Float(t[:longitude]))

		t["x"] = result[:x]
		t["y"] = result[:y]
		
	end 

	data[:players].each do |p| 
		result =  sim.getGridCoord(Float(p[:latitude]),Float(p[:longitude]))

		p["x"] = result[:x]
		p["y"] = result[:y]
		
	end 

	data[:dropoffpoints].each do |d|
		result = sim.getGridCirclePresentation(
			Float(d[:latitude]),
			Float(d[:longitude]),
			Float(d[:radius]))
		d["x-center"]=result[:x]
		d["y-center"]=result[:y]
		d["grid-radius"]=result[:radius]
	end 

	response = { :time_frame => sec/12, :state => data}	

	response.to_json
  end 

  
end 

