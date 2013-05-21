class Controller < Sinatra::Base 
  ################for development #####################
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
  
  
  #####################################################
  
  def default_headers
     headers = {'Content-Type' => 'application/json', 'User-Agent' => "ruby", 'Accept' => 'application/json'}
     headers
  end

  before do
  	@current_page = request.path[/(\w|-)+/]
    response.headers['Access-Control-Allow-Origin'] = '*'
      #if request.path =~ /^\/admin\//
      #require_login
      #geoloqi.get_auth(params[:code], request.url) if params[:code] && !geoloqi.access_token?
      #admins_only
      #end
  end

  after do
      #do something
  end

  get '/?' do
    erb :'splash', :layout => false
  end
  
  get '/admin/replay' do
    @logs=[]
  	Dir.glob("./logs/session*") do |fname|
  		@logs<< File.basename(fname)
	end 
    @action="replay"
          
    erb :'admin/games/index', :layout => :'admin/layout'
  end

  get '/admin/games' do
      @action="games"
      @games = Game.all :template=>0
          
      erb :'admin/games/index', :layout => :'admin/layout'
  end

   get '/admin/template' do
      @action="template" 
      @games = Game.all :template=>1
          
      erb :'admin/games/index', :layout => :'admin/layout'
  end

  get '/admin/games/:layer_id/edit' do
    @game = Game.get params[:layer_id]
    erb :'admin/games/edit', :layout => :'admin/layout'
  
  end
  
  get '/admin/games/:layer_id/saveSetting' do
     @game = Game.get params[:layer_id]
     copy_game_record(@game,params['name'],1)
  	 {"status"=>:ok}.to_json
  end
  
   get '/admin/games/:layer_id/create_from_setting' do
     @game = Game.get params[:layer_id]
     copy_game_record(@game,params['name'],0)
	 redirect '/admin/template'
  end



  put '/admin/games/:layer_id' do
    @game = Game.get params[:layer_id]
    @game.update params[:game]

    redirect '/admin/games'
  end

  get '/admin/games/:layer_id/console' do
      @game = Game.get params[:layer_id]
      erb :'/admin/games/console', :layout => :'admin/layout'
  end 

  post '/game/mobile/:layer_id/message' do
      @game = Game.get params[:layer_id]
	  player_id = params[:id]
	  player = @game.players.first :id => player_id
		
      socketIO.broadcast( 
                         { 
                            :channel=> params[:layer_id],             
                            :data => { :message=>{:content=>params[:content], :player_initials=> player.initials, :player_name=> player.name} }                          
                            
                         }.to_json)
      {"status"=>:ok}.to_json

  end 
  
  
   post '/admin/games/:layer_id/massage' do
      @game = Game.get params[:layer_id]
      socketIO.broadcast( 
                         { 
                            :channel=> params[:layer_id],          
                            :data => { :message=>{:content=>params[:content], :player_initials=> :HQ, :player_name=> :controller} }                          
                            
                         }.to_json)
      {"status"=>:ok}.to_json

  end 


  get '/admin/games/:layer_id/ready_check' do
    @game = Game.get params[:layer_id]
    players=[]
    
    puts :hello
    
    
    socketIO.broadcast( 
                          { 
                           :channel=> params[:layer_id],             
                           :data=>{
                           :system=>"ready_check"
                          }
                       }.to_json)

    @game.players.each{ |p|
        
        p.update(:status=>-1)
        players<<{
            :id=> p.id,
            :name=> p.name
        }
    }
      
      
    {"players"=>players}.to_json
    
  end 

  
  get '/get_log/:folder' do
  
    #file = File.new("logs/#{params[:layer_id]}/log-1-2", "r")
    log=File.read("replay/"+params[:folder])
    log
    
    
  end


  get '/get_log/:folder/json' do
  
    #file = File.new("logs/#{params[:layer_id]}/log-1-2", "r")
    log=File.read("replay/"+params[:folder])
    log.to_json
    
    
  end
  
  
 

  get '/admin/games/:layer_id/ready_status' do
    @game = Game.get params[:layer_id]
    players=[]
    
    @game.players.each{ |p|
        players<<{
            :id=> p.id,
            :name=> p.name,
            :status=> p.status
        }
    }
    
    
    {"players"=>players}.to_json
    
  end 

  get '/player/ready_check' do
      player = Player.get params[:id]
  
      
      
      if params[:ready] == "true"
          #puts :bbb
          player.update(:status=>1)
      elsif params[:ready] == "false"
          #puts :aaa
          player.update(:status=>0)
      end
       puts :ccc
  end

  delete '/admin/games/:layer_id' do
    @game = Game.get params[:layer_id]
   
    @game.destroy
    redirect '/admin/games'
  end

  get '/game/:layer_id/complete' do
    @game = Game.first :layer_id => params[:layer_id]
	@winner = (@game.points_for('red') > @game.points_for('blue') ? 'red' : 'blue')
    erb :'complete'
  end

  

  get '/admin/games/:layer_id/end' do
    game=Game.first :layer_id=>params[:layer_id]
    #set up log folder

    newDir="session-#{params[:layer_id]}-#{Time.now.to_s}"
    Dir.chdir("logs")
    Dir.mkdir(newDir)
      
    Dir.glob("log-#{params[:layer_id]}*").each do |f|
      	system('mv', f, "#{newDir}/#{f}")
    end
      
    Dir.chdir("..")
    if game.is_active<0
        return {:error=>"game not active"}.to_json
    else
        endGame(game)
        redirect :'admin/games'
    end
  end

  

   # TODO: bbox

  post '/admin/games/:layer_id/addBoundingBox' do
     game=Game.first :layer_id=>params[:layer_id]
     game.boundings.create :swLatitude=> params[:swLatitude], :swLongitude=> params[:swLongitude], :neLatitude=> params[:neLatitude], :neLongitude=> params[:neLongitude]
     {:status=> "ok"}.to_json
  end 
  
  post '/admin/games/:layer_id/addRadiationBit' do
     game=Game.first :layer_id=>params[:layer_id]
     game.radiations.create :latitude=> params[:latitude], :longitude=> params[:longitude], :radius=>50
     {:status=> "ok"}.to_json
  end 
   
  post '/admin/games/:layer_id/addTask' do
        game=Game.first :layer_id=>params[:layer_id]
        task=game.tasks.create :latitude=> params[:latitude], :longitude=> params[:longitude], :type=> params[:task_type]
        {:status=> "ok"}.to_json
  end 
  
  post '/admin/games/:layer_id/addDropOffPoint' do
        game=Game.first :layer_id=>params[:layer_id]
        dropOffpoint=game.dropoffpoints.create :latitude=> params[:latitude], :longitude=> params[:longitude], :radius=> params[:radius]
        {:status=> "ok"}.to_json
  end 

  get '/admin/games/:layer_id/clearBoundingBox' do
      game=Game.first :layer_id=>params[:layer_id]
      game.boundings.each do |box|
          box.destroy
      end 
      {:status=>"ok"}.to_json
  end 
#clear both dropoff points and tasks
  get '/admin/games/:layer_id/clearRadiationBit' do
      game=Game.first :layer_id=>params[:layer_id]
      game.tasks.each do |bit|
          bit.destroy
      end 
      
      game.dropoffpoints.each do |bit|
          bit.destroy
      end 
      {:status=>"ok"}.to_json
  end 
 
 get '/player/:i1/:i2/:role/map_icon.png' do
    a = params[:i1].upcase
    b = params[:i2].upcase
        
    file_path = File.join Controller.root, "public", "icons", "#{a}#{b}_#{params[:role]}.png"
    file_path_tmp = "#{file_path}tmp"
    marker_path = File.join Controller.root, "public", "img", "#{params[:role]}.png"
    
    if File.exist?(file_path)
        send_file file_path
    else
        file_path_1 = File.join Controller.root, "public", "characters", a+".png"
        file_path_2 = File.join Controller.root, "public", "characters", b+".png"
        
        `convert \\( #{marker_path} \\( -geometry +11+6 -compose Over \\( #{file_path_2} -resize 130% \\) \\) -composite \\) \\( -geometry +2+6 -compose Over \\( #{file_path_1} -resize 130% \\) \\) -composite #{file_path_tmp}`
        FileUtils.mv file_path_tmp, file_path
        send_file file_path
        
    end
 
  end


 
  get '/game/:layer_id/getLocations' do 
  	game = Game.first :layer_id => params[:layer_id]
  	game.players.each do |player| 
  			players = []
  			players << {
	  			:player_id => player.id,
    	    	:latitude => player.latitude,
        		:longitude => player.longitude
        		}
    
    end
    {:player => players}.to_json
  end
    

  # A easy way to go back
  get '/game/:layer_id/?' do
    @game = Game.first :layer_id => params[:layer_id]
      
      #if game ended, clear them
    if @game.is_active==1
        session.clear
        params[:id]=nil
    end
   
    player = Player.first :id => session[:id], :game => @game
    puts session[:id]
    if !player 
        #mobile users store id information in params 
        player = Player.first :id => params[:id], :game => @game
        puts "Try to find player #{params[:id]}"
        
    end
    
    @user_id=""
    if player
        @user_id = player.id
        @user_team = player.team.name
    end
    
      
      @truck= get_truck params[:layer_id]
      if @truck
          @truck_latitude=@truck.latitude
          @truck_longitude=@truck.longitude
          
      else
          @truck_latitude=@game.latitude
          @truck_longitude=@game.longitude
      end

    @user_initials = player ? player.name : ''
    erb :'index'
  end
  
  get '/game/mobile/:layer_id/messages' do
	@game = Game.first :layer_id => params[:layer_id]
    #mobile users store id information in params 
    player = Player.first :id => params[:id], :game => @game
    @user_id = player.id
    @user_initials = player ? player.name : ''
    erb :'index_user_msgs', :layout => :'layout_user_msgs'
	
   end


  
  get '/game/mobile/:layer_id/?' do
    @game = Game.first :layer_id => params[:layer_id]
    #mobile users store id information in params 
    player = Player.first :id => params[:id], :game => @game
    
    if player
    	@user_id = player.id
   	    @user_initials = player ? player.name : ''
   	    @user_skill= player.skill_string()
   	end 
   	
    erb :'index_user', :layout => :'layout_user'
  end
  
  
  
  get '/game/:layer_id/dashboard' do
    @game = Game.first :layer_id => params[:layer_id]
    @socket_io_url=SOCKET_CLIENT_REF
   
    erb :'dashboard'
  end



  get '/replay/:filename/:setup_file' do
  	 @game = Game.first :layer_id => params[:layer_id]
  	 #@replay_data = File.read("logs/#{params[:filename]}")
         @replay_file=params[:filename]
	 @setup_file=params[:setup_file]
   	 erb :'replay'
  end
  
  get '/replay/:filename/delete' do
  	 require 'fileutils'
  	 file=params[:filename]
  	 #file.gsub!("%"," ")
  	 puts file
     FileUtils.rm_rf("logs/#{file}")
     redirect "/admin/replay"
   	
  end

  get '/replay2/:filename' do
	replay_option = {:latitude => 52.49, 
			 :longitude=> -1.0, 
			 :layer_id => params[:filename], 
			 :radius => "1594",
			 :speed => 1.0}
	
	$replays ||= {}
	$replays[params[:filename]] ||= Replay.new replay_option, socketIO
  	
	@game = $replays[params[:filename]]
    	@socket_io_url=SOCKET_CLIENT_REF

	$replays[params[:filename]].start
   
    	erb :'dashboard'
  end
  
  
  #######################    mapeditor   ####################
  get '/admin/simulation_files' do
	simulation_files 
  end 

  
  get '/admin/simulation_files/:fname/getFiles' do
  
	File.read("cloud/"+params[:fname])
  end

  post "/admin/games/:game_id/updateGameSettings" do
	puts  params 
	game = Game.get params[:game_id]
	if params[:sim_lat] && params[:sim_lng]
		game.sim_lat = Float(params[:sim_lat])
		game.sim_lng = Float(params[:sim_lng])
	end 
	
	if params[:terrains]
		game.terrains=params[:terrains]
	end 

	if params[:simulation_file]
		game.simulation_file = params[:simulation_file] 
	end 

	if params[:grid_size]
		game.grid_size = Float(params[:grid_size])
	end 

	if params[:sim_update_interval]
		game.sim_update_interval = Float(params[:sim_update_interval])
	end 

	if params[:dropOffPoints]
		game.dropoffpoints.destroy
		new_dpZones =  params[:dropOffPoints]
		new_dpZones.each do |kay, d|
			game.dropoffpoints.create :latitude=> d[:latitude], :longitude=> d[:longitude], :radius=> d[:radius]
		end 	
	end 

	if params[:simulation_file]
		game.simulation_file = params[:simulation_file]
	end

	if params[:tasks]
		game.tasks.destroy
		new_tasks =  params[:tasks]
		new_tasks.each do |key, t|
			game.tasks.create :latitude=> t[:latitude], :longitude=> t[:longitude], :type=> t[:type]
		end 
	end 
	
	{ :saved => game.save}.to_json
	
  end 

    
  
  get '/admin/games/new' do
    @game=Game.new
  
    erb :'admin/games/new', :layout => :'admin/layout'
  end

  get '/admin/games/:id/mapeditor' do
    @game = Game.get params[:id]
    
    #if $game_area_top_left[@game.layer_id]
    #	@top_left_latitude = game.sim_lat
    #	@top_left_longitude = game.sim_lng
    #else
    #	@top_left_latitude = DEFAULT_SIM_LAT
    #	@top_left_longitude = DEFAULT_SIM_LNG
    #end
    
    @top_left_latitude=@game.sim_lat.to_s('F')
    @top_left_longitude=@game.sim_lng.to_s('F')
   
    erb :'admin/games/mapeditor', :layout => false
  end

  post '/admin/games' do
    game = Game.new params[:game]
    game.sim_lat=DEFAULT_SIM_LAT
    game.sim_lng=DEFAULT_SIM_LNG
    game.save
    redirect "/admin/games/#{game.layer_id}/mapeditor"
  end


  get '/admin/games/:layer_id/setup.json' do
    content_type :json

    @game = Game.get params[:layer_id]
    snapshot @game
      
  end
  
  #######################    user management   ####################
  
  # TODO: mobile game join 

  post '/game/:layer_id/join' do
    content_type :json
    
    game = Game.first :layer_id => params[:layer_id]
    
    player_id = params[:id]
    puts "client try to join game"
      
    if player_id
        player = game.players.first :id => player_id
        
        if player
            return {:status=>"ok"}.to_json
        else
            return {:error=>"your info not found, game may have been reset, try logout and login again"}.to_json
        end
        
    
    end 
      
    if params[:role_id]==nil
        return {:error=>"error no role_id supplied"}.to_json
    elsif params[:email]==nil
    	return {:error=>"invalid email"}.to_json
    elsif params[:name]==nil
    	return {:error=>"invalid name"}.to_json
    elsif params[:initials]==nil
    	return {:error=>"invalid initials"}.to_json
    else
        player = game.players.create  :initials => params[:initials], :name => params[:name], :skill => params[:role_id], :team=>game.pick_team("runner")#team is a legacy
    end
      
    
    if player
      
        #update player info, add game information.
        #player.update(:game_layer_id=>game.layer_id,:team => game.pick_team('runner'))
        #broadcast to socket.io
        #session[:id]=player.id
        
        player.broadcast(socketIO)
        player.broadcast_health(socketIO)
        
        
        
        socketIO.broadcast( 
                           { 
                            :channel=> params[:layer_id],             
                            :data=>{
                                    :textMassage=>{:content=>"#{player.name} join the game"}
                           	}
                           }.to_json)
    end
    {'skill' => player.skill_string(), 'user_id' => player.id}.to_json
      
  end
  
  post '/game/:layer_id/logout' do
    
    #delete user from database
    game=Game.first :layer_id=>params[:layer_id]
    player=game.players.first :id => params[:id]
    
   
    
    socketIO.broadcast( 
                       { 
                       :channel=> params[:layer_id],             
                         :data=>{
                            :cleanup=>{
                                :player=>[player.id]
                            }
                         }
                       }.to_json)
    player.destroy
    session.clear
    
   
    {:status=> "ok"}.to_json
              
    
  end
  
  #######################    game management   ####################
  
  get '/games/list' do
    games=[]
    g =  Game.all :template=>0
    g.each do |g|
        games << {"layer_id"=> g.layer_id , "name"=> g.name, "description"=> "", "is_active"=>g.is_active}

    end
    
    {"games"=> games}.to_json
  end 

  get '/admin/games/:layer_id/start' do
    

    game=Game.first :layer_id=>params[:layer_id]
    #snapshot to log when start
    File.open("logs/log-#{params[:layer_id]}-0", 'w') {|f| f.write(snapshot(game).to_s) }


    if game.is_active!= -1
        return {:error=>"game already begin"}.to_json
        
    else
        game.update(:is_active=>0)
		
	#CHANGE TO ADAPT TO GRID SIZE (400/X)
	#Library Jubilee Campus (debugging) 52.953664,-1.188509
	#Wollaton Park 52.9491938, -1.2144399
	#North of Jubilee campus 52.956046,-1.18878
		
        $simulations[game.layer_id] = Simulation.new("simulation_data_03.txt", 
        game.sim_lat, 
        game.sim_lng, 
        8, 
        Time.now, 
        0.2)
      
        
        
        
        Thread.abort_on_exception = true
         
        $mainloops[game.layer_id]  = Thread.new(game) { |g|
        	count=0
        	#6 sec waiting, lett clients get ready
        	sleep 6
        	
            while(g.is_active==0) do
                
            	g= Game.get g.layer_id
                puts "game #{g.layer_id}, loop running count #{count}"
                #initial update of task
                
                if count==1 
                	g.tasks.each do |t|
                		t.broadcast(socketIO);
                	end 
                end
                
                update_game(g)
				
				if count%6==0
                    #diffFrame can be nil, (when there is no diff between two frames) 
					diffFrame=$simulations[g.layer_id].getIndexedDiffFrame(Time.now)
					
					if diffFrame
                    	puts "heat map redraw in this loop"
                    	socketIO.broadcast( 
                                       { 
                                       :channel=> "#{game.layer_id}-1",             
                                       :data=>{
                                       #:heatmap=>@simulation.getTimeFrameWithLatLng(Time.now)
                                        :heatmap=>diffFrame
                                       }
                                       }.to_json)
                    end

                    
                end
                
                count=count+1
                sleep 1
                
            end
        }
        
        game.broadcast(socketIO, "start")
        
       
        #@games = Game.all
        
        redirect '/admin/games'
    end
    
    
  end 
  
  put '/admin/games/:layer_id/reset' do
    game = Game.get params[:layer_id]
      game.update(:is_active=>-1)
    #result = geoloqi_app.get 'place/list', :layer_id => game.layer_id, :limit => 0
      game.players.each do |p|
          p.destroy
      end 
      game.tasks.each do |t|
          t.destroy
      end 
      
      game.broadcast(socketIO,"reset")
    
      redirect '/admin/games'
  end
  
   ############fall back plan#####################
  post '/game/:layer_id/postLocation' do
  	game = Game.first :layer_id => params[:layer_id]
  	playerId = params[:id]
    player = game.players.first :id => playerId
    #current_exposure = $simulations[params[:layer_id]].getReadingByLatLong(params[:latitude], params[:longitude], Time.now)
    #exposure = player.exposure + current_exposure
    player.latitude=params[:latitude]
    player.longitude=params[:longitude]
    player.save
    {:status=> :ok}.to_json
  end
  
  
  post '/game/:layer_id/getReading' do
  	game = Game.first :layer_id => params[:layer_id]
    current_exposure = $simulations[params[:layer_id]].getReadingByLatLong(params[:latitude], params[:longitude], Time.now)
    {:current_exposure => current_exposure}.to_json
  end


end
