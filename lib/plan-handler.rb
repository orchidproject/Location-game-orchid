require 'uri'
require 'net/http'

class PlanHandler
	def initialize

	end 
	
	def coordConversion

	end 

	def load(step)
	
		uri = URI("http://202.141.161.27/atomic/")
		http = nil
		if (Controller::PROXY_ADDRESS == "no_proxy")	
			puts "load data with no proxy"
			http = Net::HTTP.new(uri.host, uri.port)
		else 
			puts "load data with proxy" + Controller::PROXY_ADDRESS 
			http = Net::HTTP.new(uri.host, uri.port,Controller::PROXY_ADDRESS, Controller::PROXY_PORT)
		end 
		#uri = URI("http://www.google.com/")
		headers = { }
		state = File.read("./lib/game_state_v1.txt")
		puts "state :"+ state
		body = "step="+step.to_s+"&state="+state
		response = http.post(uri.path,body,headers) 

		response.body 
	end 
		
	def constructPlan
			


	end 

end
