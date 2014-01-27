class Controller < Sinatra::Base 

	get '/charts/:data1/:data2' do
		@data1 = File.read "./charts/" + params[:data1]
		@data2 = File.read "./charts/" + params[:data2]
		
		erb :'charts/two_charts', :layout =>false 

	end 

	get '/charts/timelines/:data1/:data2' do
		@data1 = File.read "./charts/" + params[:data1]
		@data2 = File.read "./charts/" + params[:data2]
		
		erb :'charts/two_timelines', :layout =>false 

	end 

	get '/charts/dashboard/:log/:setup' do 
		@log =  params[:log] 
		@setup =  params[:setup] 

		erb :'charts/dashboard' 
	end 

end 
