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

	post '/game/:layer_id/find_target'  do
		data = JSON.parse(request.body.read)
		t = Task.get(data["target_id"])
		puts t.state 
		puts Task::State::IDLE
		if t.nil?
			return {state:"error", msg:"no target found"}.to_json
		elsif t.state == Task::State::UNSEEN
			t.state = Task::State::IDLE
			t.save
			t.broadcast(socketIO);
		else
			return {state:"error", msg:"target already discovered"}.to_json
		end

		return {state:"ok"}.to_json
	end

end
