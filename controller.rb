class Controller < Sinatra::Base
    
  get '/games/list' do
    games=[]
    Game.all.each do |g|
        games << {"layer_id"=> g.layer_id , "name"=> g.name, "description"=> "", "is_active"=>g.is_active}

    end
    
    {"games"=> games}.to_json
  end 

    
  
   
  
 
    
  #update truck locaiton save to database #para latitude longitude.  
       #post '/game/:layer_id/moveTruck' 
       #post '/game/:layer_id/dropCargo' do

  get '/game/:layer_id/logout' do
    
    #delete user from database
    game=Game.first :layer_id=>params[:layer_id]
    player=game.players.first :id => params[:user_id]
      
        
   
     
    socketIO.broadcast( 
                         { 
                            :channel=> params[:layer_id],             
                            :data=>{
                                :textMassage=>{:content=>"#{player.name} quitted game"},
                                :player=>{:id=>player.id,:action=>"cleanup"}
                            }
                         }.to_json)
    player.destroy
    session.clear
    redirect "/game/#{params[:layer_id]}/"
   
      
  end



  #post handler is for mobile device
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
  
                    
  
                


 
  
get '/game/:layer_id/activateTarget' do
	taskId = params[:id]
	game = Game.first :layer_id => params[:layer_id]
	task = game.tasks.first :id => taskId 
	task.update(:status=>'active')
	socketIO.broadcast
	(
		{
		:channel=> params[:layer_id],             
		:data=>
			{
			:id => t.id,
			:type=>t.requirement,
			:description=> t.description,
			:longitude => t.longitude.to_s('F'),
			:latitude => t.latitude.to_s('F'),
			:status => t.status
			}
		}.to_json
	)
end
      



      
  

  
    
  
  #for development 
  get '/migrate' do
        DataMapper.auto_migrate!
  end 
  
  def default_headers
     headers = {'Content-Type' => 'application/json', 'User-Agent' => "ruby", 'Accept' => 'application/json'}
     headers
  end

  get '/test' do
     
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
      
  end

  get '/?' do
    erb :'splash', :layout => false
  end

  get '/admin/games' do
    @games = Game.all
          
      erb :'admin/games/index', :layout => :'admin/layout'
  end

  get '/admin/games/new' do
    @game = Game.new
    erb :'admin/games/new', :layout => :'admin/layout'
  end

  get '/admin/games/:id/mapeditor' do
    @game = Game.get params[:id]
    erb :'admin/games/mapeditor', :layout => false
  end

  post '/admin/games' do
    game = Game.new params[:game]
    game.save
    redirect "/admin/games/#{game.layer_id}/mapeditor"
  end


  get '/admin/games/:layer_id/setup.json' do
    content_type :json
    @game = Game.get params[:layer_id]
    boxes =[]
	radiation = []
    task = []
      
	@game.radiations.each do |p|
		radiation<<{
			:id=>p.id,
			:lat=>p.latitude.to_s('F'),
			:lng=>p.longitude.to_s('F'),
			:radius=>p.radius.to_s()
		}
	end
    @game.boundings.each do |p|
        boxes<<{
            :id=>p.id,
            :neLatitude => p.neLatitude.to_s('F'),
            :neLongitude => p.neLongitude.to_s('F'),
            :swLatitude => p.swLatitude.to_s('F'),
            :swLongitude => p.swLongitude.to_s('F')
        }
    end
      
    @game.tasks.each do |t|
          task<<{
              :id=>t.id,
              :latitude => t.latitude.to_s('F'),
              :longitude => t.longitude.to_s('F'),
			  :type => t.type,
              :status => t.status,
              :requirement => t.requirement
              
          }
    end

      
      {:boundingBoxes=>boxes,:radiationBits=>radiation,:tasks=>task}.to_json
      
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
      #clear log
      #I know I should not hard code file name here, but... 
      oldFile="logs/log-#{params[:layer_id]}"
      newFile="logs/log-#{params[:layer_id]}-#{Time.now.to_f}"
      if FileTest.exist?(oldFile)
          File.rename(oldFile,newFile)
      end
      
      socketIO.broadcast( 
                         { 
                         :channel=> params[:layer_id],             
                         :data=>{
                         :system=>"reset"
                         }
                         }.to_json)
    
    redirect '/admin/games'
  end


#be careful for the layer id 
  get '/admin/games/:layer_id/edit' do
    @game = Game.get params[:layer_id]
    erb :'admin/games/edit', :layout => :'admin/layout'
  end

  put '/admin/games/:layer_id/end_game' do
    @game = Game.get params[:layer_id]
    redirect '/admin/games'
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

  post '/admin/games/:layer_id/massage' do
      @game = Game.get params[:layer_id]
      socketIO.broadcast( 
                         { 
                            :channel=> params[:layer_id],             
                            :data => { :message=>{:content=>params[:content]}  }                          
                            
                         }.to_json)
      {"status"=>:ok}.to_json

  end 



  get '/admin/games/:layer_id/ready_check' do
    @game = Game.get params[:layer_id]
    players=[]
    
    
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

  get '/get_log/:layer_id/' do
    counter = 1
    file = File.new("logs/log-#{params[:layer_id]}", "r")
    log=""
    while (line = file.gets)
        log= "#{log}#{line}"
        counter = counter + 1
    end
    
    file.close
      
    log
    
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

  get '/admin/games/:layer_id/start' do
    game=Game.first :layer_id=>params[:layer_id]
    if game.is_active!= -1
        return {:error=>"game already begin"}.to_json
        
    else
        game.update(:is_active=>0)
		
		#CHANGE TO ADAPT TO GRID SIZE (400/X)
		#Library Jubilee Campus (debugging) 52.953664,-1.188509
		#Wollaton Park 52.9491938, -1.2144399
		#North of Jubilee campus 52.956046,-1.18878
		sim = get_simulations(game.layer_id)
        sim = Simulation.new("simulation_data_03.txt", DEFAULT_SIM_LAT, DEFAULT_SIM_LNG, 8, Time.now, 0.1)
        
        
        
        
        Thread.abort_on_exception = true
        ml = get_mainloops(game.layer_id) 
        ml = Thread.new {
        	count=0
        	game_id=params[:layer_id]
        	#6 sec waiting, lett clients get ready
        	sleep 6
            
            while(game.is_active==0) do
            	#?seems cg will release game ob, so assgin a new one
                game=Game.first :layer_id=>game_id
                puts "game #{game_id}, loop running count #{count}"
                update_game(game)
				
				if count%6==0
                    #diffFrame can be nil, (when there is no diff between two frames) 
					diffFrame=sim.getIndexedDiffFrame(Time.now)
					
					if diffFrame
                    	puts "heat map redraw in this loop"
                    	socketIO.broadcast( 
                                       { 
                                       :channel=> "#{game_id}-1",             
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
        
        socketIO.broadcast( 
                           { 
                           :channel=> params[:layer_id],             
                           :data=>{
                           :system=>"start"
                           }
                           }.to_json)
        @games = Game.all
        erb :'admin/games/index', :layout => :'admin/layout'
    end
    
    
  end 

  get '/admin/games/:layer_id/end' do
    game=Game.first :layer_id=>params[:layer_id]
    if game.is_active<0
        return {:error=>"game not active"}.to_json
    else
        endGame(game)
        erb :'admin/games/index', :layout => :'admin/layout'
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

  get '/admin/games/:layer_id/clearBoundingBox' do
      game=Game.first :layer_id=>params[:layer_id]
      game.boundings.each do |box|
          box.destroy
      end 
      {:status=>"ok"}.to_json
  end 

  get '/admin/games/:layer_id/clearRadiationBit' do
      game=Game.first :layer_id=>params[:layer_id]
      game.tasks.each do |bit|
          bit.destroy
      end 
      {:status=>"ok"}.to_json
  end 





  get '/player/:i1/:i2/:team/map_icon.png' do
    a = params[:i1].upcase
    b = params[:i2].upcase
        
    puts :fdsa
    file_path = File.join Controller.root, "public", "icons", "#{a}#{b}_#{params[:team]}.png"
    file_path_tmp = "#{file_path}tmp"
    marker_path = File.join Controller.root, "public", "img", "player-icon-" + params[:team] + ".png"
    
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


 #object templates in this fuction
 get '/game/:layer_id/status.json' do
    content_type 'application/json'
    game = Game.first :layer_id => params[:layer_id]
    
    
    locations = []
    players = []
	tasks = []
    exposures = []
    healths = []
     
    
    game.players.each do |player|
        players << {
            :id=> player.id,
            :name=> player.name,
            :points_cache => player.points_cache,
            :team => player.team.name,
            :skill => player.skill
        }

        healths << {
            #exposure { player_id : integer , value : float }
            :player_id => player.id,
            :value => player.health
        }
        
        exposures << {
            #health { player_id : integer , value : integer }
            :player_id => player.id,
            :value => player.health
        }
        
        locations << {
        	:player_id => player.id,
        	:latitude => player.latitude,
        	:longitude => player.longitude,
        	:skill => player.skill_string()
        }
       
        
    end
	
	game.radiations.each do |bit|
		radiations << {
			:id => bit.id,
			:longitude => bit.longitude.to_s('F'),
			:latitude => bit.latitude.to_s('F')
		}
	end
     
    game.tasks.each do |t|
       # if t.status.eql? "active"
         tasks << {
             :id => t.id,
             :type=>t.type,
			 :requirement=>t.requirement,
             :description=> t.description,
             :longitude => t.longitude.to_s('F'),
             :latitude => t.latitude.to_s('F'),
			 :status => t.status
         }
        #end
    end
    
         
    
     {:location => locations,:task=>tasks,:exposure=>exposures,:health=>healths,:player=>players}.to_json
    
end
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
            return {:error=>"logout first"}.to_json
        end
        
    
    end 
      
    
      
      
      
    if params[:role_id]==nil
        return {:error=>"logout first"}.to_json
    elsif params[:email]==nil
    	return {:error=>"invalid email"}.to_json
    elsif params[:name]==nil
    	return {:error=>"invalid name"}.to_json
    else
        player = game.players.create  :email =>params[:email], :name => params[:name], :skill => params[:role_id], :team=>game.pick_team("runner")
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
    {'team_name' => player.team.name, 'user_id' => player.id}.to_json
      
  end
  
  
  post '/game/:layer_id/postLocation' do
  	game = Game.first :layer_id => params[:layer_id]
  	playerId = params[:id]
    player = game.players.first :id => playerId
    current_exposure = get_simulations(params[:layer_id]).getReadingByLatLong(params[:latitude], params[:longitude], Time.now)
    exposure = player.exposure + current_exposure
    player.update(:latitude => params[:latitude], :longitude => params[:longitude], :current_exposure => current_exposure, :exposure => exposure)
    {:exposure => exposure , :current_exposure => current_exposure}.to_json
  end
  
  
  post '/game/:layer_id/getReading' do
  	game = Game.first :layer_id => params[:layer_id]
    current_exposure = get_simulations(params[:layer_id]).getReadingByLatLong(params[:latitude], params[:longitude], Time.now)
    {:current_exposure => current_exposure}.to_json
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
  
  get '/game/mobile/:layer_id/?' do
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
        puts "find player #{params[:id]}"
        
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
    erb :'index_user', :layout => :'layout_user'
  end
  
  
  get '/game/:layer_id/dashboard' do
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
        puts "find player #{params[:id]}"
        
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
    erb :'dashboard'
  end



  get '/replay/:layer_id/?' do
    @game = Game.first :layer_id => params[:layer_id]
    @user_id = nil
    @user_team = 'replay'
    @user_initials = ''
    
    erb :'index'
  end


end