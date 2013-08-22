class Controller < Sinatra::Base 

	get '/charts/:data1/:data2' do
		@data1 = File.read "./charts/" + params[:data1]
		@data2 = File.read "./charts/" + params[:data2]
		
		erb :'charts/two_charts', :layout =>false 

	end 

end 
