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
    instruction = []

    game.players.each do |p|
		next if (p.status == "incapacitated" && action == "fetch") 
		player <<{
		:id => p.id,
		:latitude => p.latitude.to_s('F'),
		:longitude => p.longitude.to_s('F'),
		:initials => p.initials,
		:skill => p.skill,
		:status => p.status,
		:health => p.health,
		:task => -1
		} 
=begin		
		ins = Instruction.last(:player_id => p.id)
		if(ins)
			
		end	
=end		
    end 
=begin
    game.confirmed_plans.last.frame.instructions do |ins|
    	instruction << {
				:teammate=> ins.getTeammate,
				:task=> ins.task_id, 
				:direction=> ins.action,
				:status => ins.status,
				#:time => ins.created_at.to_time.to_i,
				:id => ins.id,
				:player_id => ins.player_id,
            	:confirmed => 1
		 	}


    end
=end
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

	  #assign a new attribute "task to players" 
	  if !t.players.nil? && t.players != ""
		pids = t.players.split(",")
		pids.each do |pid|
			if pid == "" || pid.nil?
				next
			end 

			player.each do |p|		
				if p[:id] == pid.to_i
					puts "got it !!!!!!"
					p[:task] = t.id
				end
			end 
	  	end 
	  end 
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
		:players => player,
		:instructions => instruction,
		:terrains => game.terrains
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
        
	 updatePlan = false 
	 updateSession = false
         game.tasks.each do |t|
         	state_change =	t.update(socketIO)
		puts state_change
		if(3 == state_change[:after]&&1 == state_change[:before]) 
			updateSession=true
		elsif(2 == state_change[:after]&&1 == state_change[:before]) 
			updatePlan = true
		end

         end
	
	 
         
        game.players.each do |p|
	    	instruction =  Instruction.last(:player_id => p.id, :status => 3)
	    	if(instruction != nil)
				instruction.status=4
				instruction.save
				puts " instruction for " + p.id.to_s + " is rejected *********************************************************************************************" + instruction.id.to_s
				updatePlan = true
	    	else
				puts "no instruction *********************************************************************************************************"  
	    	end



        if (p.latitude == nil || p.longitude == nil)
         	puts "no location for user #{p.id}"
         	next
             end 
         	 
         	 
             if(sim.isOnMap(p.latitude, p.longitude))
	        if (p.exposure > 1000 )
                	p.status="incapacitated"
			p.save
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
	
	 if(updateSession)
		agentUpdateSession(game.layer_id,frame) 
	 elsif(updatePlan)
	 	#commented out for human mediation
		#agentFetchPlan(game.layer_id,frame)
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
	#agent = PlanHandler.instances(game_id)
	#data = agentSnapshot(game_id,frame,"fetch")
	#agent.pushFetchTask(data.to_json) do |res|
		#processResponse(game_id,res,[])		
	#end 
  end

  def agentUpdateSession(game_id, frame)
	agent = PlanHandler.instances(game_id)
	data = agentSnapshot(game_id,frame,"update")
	agent.pushUpdateTask(data.to_json)	do |res|
		#agentFetchPlan(game_id, frame) 
	end 

  end 


  def cell_to_coords(x,y,game)
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
	return sim.getCoordsFromGrid(x,y)
end 


end
