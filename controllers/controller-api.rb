class Controller < Sinatra::Base 
	#object templates in this fuction
	get '/game/:layer_id/status.json' do
	    content_type :json

	    if params[:layer_id]=="-1"
		return {}.to_json  #reserved for replay method 2
	    else
		puts params[:layer_id]
	    end 

	    @game = Game.get params[:layer_id]
		#TODO make it for replay
	    snapshot @game
    
	end

	post '/game/:layer_id/find_target_old'  do

		data = JSON.parse(request.body.read)
		t = Task.get(data["target_id"])
		puts t.state 
		puts Task::State::IDLE
		if t.nil?
			return {:state => "error", :msg => "no target found"}.to_json
		elsif t.state == Task::State::UNSEEN
			t.state = Task::State::IDLE
			t.save
			t.broadcast(socketIO);
		else
			return {:state => "error", :msg =>"target already discovered"}.to_json
		end

		return {:state=>"ok"}.to_json
	end

	post '/game/:layer_id/find_target'  do
		#find according to shared id and layer_id, location?
		#if unseen, set to seen
		#set type
		#if can not be found report error.
		data = JSON.parse(request.body.read)
		
		t = Task.all(:game_layer_id => params[:layer_id], :shared_id => data["target_id"]).first
		return {:state=>"error", :msg =>"no target found"}.to_json if t.nil?

		if t.state == Task::State::UNSEEN
			t.state = Task::State::IDLE		
		end
		t.type = data["type_id"]
		t.save
		t.broadcast(socketIO);

		return {:state => "ok"}.to_json
	end

	post '/game/:layer_id/reveal_all'  do
		game = Game.get(params[:layer_id])
		game.tasks.each do |t|
			t.state = 2
			t.broadcast(socketIO)
		end
	end

	post '/game/:layer_id/invalidate_target' do
		socketIO.broadcast(
        { 
            :channel=> params[:layer_id],     
          	:data=>{        
            	:system => "prov"
            }
      	}.to_json)
	end
end
