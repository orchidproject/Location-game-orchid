require 'uri'
require 'net/http'

class PlanHandler
	def initialize

	end 
	
	def coordConversion

	end 

	def load(step)
		uri = URI("http://202.141.161.27/atomic/")
		#uri = URI("http://www.google.com/")
		http = Net::HTTP.new(uri.host, uri.port)
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
