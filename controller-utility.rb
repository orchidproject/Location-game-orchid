class Controller < Sinatra::Base
	  def update_score(game)
      
      scores = {}
      game.players.each do |player|
          scores[player.id] = player.points_cache
      end
  end

 def get_truck(layer_id)
       game=Game.first :layer_id=>layer_id
       team = game.teams :name=>"truck"
       
       #only one truck player shoud be in the team 
       truck= team.players.first
       return truck
   end
 
   def get_controller(layer_id)
       game=Game.first :layer_id=>layer_id
       team = game.teams :name=>"controller"
       
       #only one truck player shoud be in the team 
       controller= team.players.first
       return controller 
 
   end 

  def endGame(game)
    game.update(:is_active=>1)
    socketIO.broadcast( 
                       { 
                       :channel=> params[:layer_id],             
                       :data=>{
                       :system=>"end"
                       }
                       }.to_json)
    @games = Game.all
    session.clear
  end 
            
  def get_mainloops(game_id)
  
  		if !$mainloops
  			$mainloops=[]
  			
  		end 
  		
        if !$mainloops[game_id]
        	$mainloops[game_id]=nil
        end
        
        return $mainloops[game_id]
  end
  
  def get_simulations(game_id)
  		if !$simulations
  			$simulations=[]
  			puts "simulation: #{$simulations.object_id}"
  		end 
        
        if !$simulations[game_id]
        	$simulations[game_id]=nil
        end
        
        return $simulations[game_id]
  end
            
  def update_game(game)
         puts "game update"
         puts get_simulations(game.layer_id)
         game.players.each do |p|
         	 if (p.latitude == nil || p.longitude == nil)
         	 	puts "no location for user #{p.id}"
         	 	next
         	 end 
         	 
         	 
             if(get_simulations(game.layer_id).isOnMap(p.latitude, p.longitude))
                p.exposure = p.exposure + check_radiation(p.latitude,p.longitude)
                p.current_exposure = check_radiation(p.latitude,p.longitude)
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
  
  def check_radiation(latitude, longitude) 
    return    @simulation.getReadingByLatLong(latitude, longitude, Time.now)
  end
            
  def get_distance(lat1,lng1,lat2,lng2)
        location1 = Geokit::LatLng.new lat1, lng1
        location2 = Geokit::LatLng.new lat2, lng2
        distance = location1.distance_to location2
        return distance
  end

end