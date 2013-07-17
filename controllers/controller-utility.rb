class Controller < Sinatra::Base
 
       
  def endGame(game)
    game.update(:is_active=>1)
    game.broadcast(socketIO, "end")
    @games = Game.all
    session.clear
  end 

  def snapshot(game,json = true, action = nil)
	
    task = []
    dropoffpoint = []
    player = []

    game.players.each do |p|
	 player <<{
		:id => p.id,
		:latitude => p.latitude.to_s('F'),
		:longitude => p.longitude.to_s('F'),
		:initials => p.initials,
		:skill => p.skill,
		:status => p.status,
		:health => p.health
	} 
    end 

    game.tasks.each do |t|
          task<<{
              :id=>t.id,
              :latitude => t.latitude.to_s('F'),
              :longitude => t.longitude.to_s('F'),
	      :type => t.type,
              :state => t.state,
              :requirement => t.requirement,
              :players => t.players
              
          }
    end
    
    game.dropoffpoints.each do |d|
          dropoffpoint<<{
              :id=>d.id,
              :latitude => d.latitude.to_s('F'),
              :longitude => d.longitude.to_s('F'),
		  :radius => d.radius,
          }
    end

   #player data not loaded? 
   # player = []
   # game.players.each do |p|
   #	player<<{
   #	}
    

    if action == "init"
	response = {
		:sim_lat=> "%f" % game.sim_lat, 
		:sim_lng=> "%f" % game.sim_lng,
		:simulation_file=> game.simulation_file,
		:sim_update_interval => game.sim_update_interval.to_s('F'),
		:grid_size=> "%f" % game.grid_size,
		:tasks=>task,
		:dropoffzones=>dropoffpoint,
    	}
	response[:terrains] = JSON.parse(game.terrains)

    elsif action=="fetch"
	response = {
		:players => player,
		:tasks => task
    	}

    elsif action=="update"
	response = {
		:tasks => task
	}	
    else
	response = {
		:sim_lat=> "%f" % game.sim_lat, 
		:sim_lng=> "%f" % game.sim_lng,
		:simulation_file=> game.simulation_file,
		:sim_update_interval => game.sim_update_interval.to_s('F'),
		:grid_size=> "%f" % game.grid_size,
		:tasks=>task,
		:dropoffpoints=>dropoffpoint,
		:players => player
    	}

    end   

    if json
	    response.to_json
    else
	    response
    end 

  end
  
  #duplicate a game instance as a template 
  def copy_game_record(game,name,is_template)
	 new_attributes = game.attributes
     new_attributes.delete(:layer_id)
     template=Game.create(new_attributes)
     template.template=is_template
     template.name=name
     template.save
     
     game.tasks.each do |t|
		new_attributes = t.attributes
		new_attributes.delete(:id)
		new_task=Task.create(new_attributes)
		new_task.game=template
		new_task.save
     end
     
     game.dropoffpoints.each do |d|
		new_attributes = d.attributes
		new_attributes.delete(:id)
		new_dropoffpoint=Dropoffpoint.create(new_attributes)
		new_dropoffpoint.game=template
		new_dropoffpoint.save
     end
  
  end
            
  module State
    PICKED_UP = 1
    DROPPED_DOWN = 2
    IDLE = 3
  end

 
  def update_game(game, frame)
         puts "game update"
         sim = $simulations[game.layer_id]
	 if(@init_plan_fetched == nil)
	   agentFetchPlan(game.layer_id,frame)
	   @init_plan_fetched=true
	 end
         
         game.tasks.each do |t|
         	state_change =	t.update(socketIO)
		puts state_change
		if(3 == state_change[:after]&&1 == state_change[:before]) 
			puts "update session"	
			#socketIO.broadcast({:channel=>game.layer_id,:data=>{:debug=>"update session"}})
			agentUpdateSession(game.layer_id,frame)
		elsif(2 == state_change[:after]&&1 == state_change[:before]) 
			puts "fetch plan"
			#socketIO.broadcast({:channel=>game.layer_id,:data=>{:debug=>"fetch plan"}})
			agentFetchPlan(game.layer_id,frame)
		end

         end
         
         game.players.each do |p|
         	 if (p.latitude == nil || p.longitude == nil)
         	 	puts "no location for user #{p.id}"
         	 	next
         	 end 
         	 
         	 
             if(sim.isOnMap(p.latitude, p.longitude))
	        if (p.exposure > 1000 )
                	p.status="incapacitated"
                	p.broadcast(socketIO)
                else
			p.current_exposure = check_radiation(p.latitude,p.longitude,game.layer_id)
			p.exposure = p.exposure + (p.current_exposure*0.2)
                 
			#broadcast exposure
			p.updateHealth(socketIO)
      			p.broadcast_curr_exposure(socketIO)           
			p.save
		end 
             else
                puts "unit not in the boundary"
             end
         end 
  end
  
  def check_radiation(latitude, longitude, game_id) 
    return    $simulations[game_id].getReadingByLatLong(latitude, longitude, Time.now)
  end
            
  def get_distance(lat1,lng1,lat2,lng2)
        location1 = Geokit::LatLng.new lat1, lng1
        location2 = Geokit::LatLng.new lat2, lng2
        distance = location1.distance_to location2
        return distance
  end

  def simulation_files
	files = []
	#directory of including file, in this case environment.rb
	Dir.new("./cloud").each do |fname|
		next if File.directory?(fname)
		f = File.open("./cloud/"+fname)
		y_size = Integer(f.readline())	
		x_size = Integer(f.readline())
		t_size = Integer(f.readline())
		file =  {:name => fname, :x_size => x_size, :y_size => y_size, :frame => t_size }
		files << file	
	end 
	files.to_json
  end 


  get '/test/:game/fetchtest' do 
	agentFetchPlan(params[:game].to_i,0)
	
  end  


  def agentFetchPlan(game_id,frame)
	agent = PlanHandler.instances(game_id)
	data = agentSnapshot(game_id,frame,"fetch")
	agent.pushFetchTask(data.to_json) do |res|
		puts "get data " 
		#File.open("./testlog.txt","a") { |f|  f.write("get data")}
		resJson = JSON.parse(res) 
		p = Game.get(game_id).plans.create 
		if(resJson["status"] == "error" )
			 puts resJson["message"]
			 return
		end 

		puts resJson.to_json
		puts "get data 2" 
		resJson["plan"].each  do |frame| 
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
	
	end 
  end

  def agentUpdateSession(game_id, frame)
	agent = PlanHandler.instances(game_id)
	data = agentSnapshot(game_id,frame,"update")
	agent.pushUpdateTask(data.to_json)	do |res|
		puts "session updated" 
		agentFetchPlan(game_id, frame) 
	end 

  end 
end
