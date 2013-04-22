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
end
