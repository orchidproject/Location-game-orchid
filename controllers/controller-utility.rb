class Controller < Sinatra::Base
 
       
  def endGame(game)
    game.update(:is_active=>1)
    game.broadcast(socketIO, "end")
    @games = Game.all
    session.clear
  end 

  def snapshot(game)
	
    task = []
    dropoffpoint = []
    player = []

    game.players.each do |p|
	 player <<{
		:id => p.id,
		:latitude => p.latitude,
		:longitude => p.longitude,
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
puts game.sim_update_interval
    {
	:terrains=> game.terrains,
	:sim_lat=> "%f" % game.sim_lat, 
	:sim_lng=> "%f" % game.sim_lng,
	:simulation_file=> game.simulation_file,
	:sim_update_interval => game.sim_update_interval.to_s('F'),
	:grid_size=> "%f" % game.grid_size,
	:tasks=>task,
	:dropoffpoints=>dropoffpoint
    }.to_json

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
            
           
  def update_game(game)
         puts "game update"
         sim = $simulations[game.layer_id]
         
         game.tasks.each do |t|
         	t.update(socketIO)
         end
         
         game.players.each do |p|
         	 if (p.latitude == nil || p.longitude == nil)
         	 	puts "no location for user #{p.id}"
         	 	next
         	 end 
         	 
         	 
             if(sim.isOnMap(p.latitude, p.longitude))
             
                p.current_exposure = check_radiation(p.latitude,p.longitude,game.layer_id)
                p.exposure = p.exposure + (p.current_exposure*0.2)
                if (p.exposure > 1000 )
                	p.status="incapacitated"
                	p.broadcast(socketIO)
                end
               
                puts "acc_exposure"
                puts p.exposure
                puts "current_exposure"
                puts p.current_exposure
                
                #broadcast exposure
                p.update
                p.broadcast_health(socketIO)
                p.broadcast_acc_exposure(socketIO)
                p.broadcast_curr_exposure(socketIO)
                 
                p.save
             else
                puts "truck not in the boundary"
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

end
