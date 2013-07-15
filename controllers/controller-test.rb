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
	time1 = Time.now	
	@agent = PlanHandler.instances(params[:game_id].to_i)	
	data = agentSnapshot(params[:game_id],params[:frame].to_i,"fetch")
	
	#append reject info 
	puts params.to_s
	data["rejections"] = JSON.parse(params[:rejections]) 	
	
	res = @agent.loadPlan(data.to_json)	
	time2 = Time.now
	#parse json
	{:sent=> data, :plan => JSON.parse(res)}.to_json
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
	
  def agentSnapshot(game_id,sec,action)
	#data should be a ruby hash, comply to game state format
	game= Game.get(game_id)

	#TODO not creating new instance is not efficient
	sim = Simulation.new("cloud/simulation_data_03.txt", 
		game.sim_lat, 
		game.sim_lng, 
		8, 
		Time.now, 
		0.2)


 

	 

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
		data[:players].each do |p| 
			result =  sim.getGridCoord(Float(p[:latitude]),Float(p[:longitude]))

			p["x"] = result[:x]
			p["y"] = result[:y]
		
		end 

		response = { 
			:time_frame => sec, 
			:session_id => game_id, 
			:rejections => [], 
			:step =>1,
			:state => data  
		}

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

  
end 

