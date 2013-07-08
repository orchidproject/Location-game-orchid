require 'uri'
require 'net/http'

class PlanHandler
	@@instances = []	
	#@status = 0 #0 for not init, -1 for error, 1 for initializing, 2 for initialized 
	
	def self.instances(session_id) 	
		return @@instances[session_id]||= PlanHandler.new(session_id)	
	end
	#private_class_method :new
	attr_reader :status
	def initialize(session_id)
		@status = 0
		@session_id =session_id
	end 

	private
	def build_uri(path) 
		uri = URI("http://aicvm-orchid1.ecs.soton.ac.uk/orchid/atomic/"+path)
		http = nil

		if (Controller::PROXY_ADDRESS == "no_proxy")	
			puts "init with no proxy"
			http = Net::HTTP.new(uri.host, uri.port)
		else 
			proxy = URI(Controller::PROXY_ADDRESS)
			puts "init with proxy " + proxy.host+ " " + proxy.port.to_s
			http = Net::HTTP.new(uri.host, uri.port, proxy.host, proxy.port)
		end	
		return http,uri

	end 
	#not right seems 	
	def checkStatus
=begin
		http = build_uri("check_status")  
	 
		#uri = URI("http://www.google.com/")
		headers = { }
		body = "data={\"session_id\":" + @session_id.to_s  + "}"
		puts @session_id.to_s 
		response = http[0].post(http[1].path,body,headers) 
		result = JSON.parse(response.body)
		puts "result: " + response.body
=end
		http = build_uri("check_status?session_id="+@session_id.to_s)  

	#	response = http[0].get(http[1].path) 
		response = Net::HTTP.get(URI("http://aicvm-orchid1.ecs.soton.ac.uk/orchid/atomic/check_status?session_id=11"),nil,nil)
		puts "check status"
		puts response 
		if @check_thread!=nil
			@check_thread.kill
			@check_thread=nil
		end
		
		@checking_thread = Thread.new do 
			while(@status == 1) do
				sleep 20
				http = build_uri("check_statusi?session_id="+@session_id)  
				response = http[0].get(http[1].path) 
				result = response.body
				puts "check status"
				if(result == "ready")
					@status = 2 
				elsif(result == "error")
					@status = -1 
				elsif(result == "processing")
					@status = 1	
				end
			end 
		end 
		@checking_thread.run
	end 

	public
	def initPlanner(init_data = nil)
		if init_data == nil 
			return 
		end
	
		http = build_uri("init_session")  
	 
		#uri = URI("http://www.google.com/")
		headers = { }
		body = "data=" + init_data
		puts init_data
		response = http[0].post(http[1].path,body,headers) 
		result = JSON.parse(response.body)
		puts "result: " + response.body
		if(result["status"] == "ok")
			#for test
			@status = 2 
			#checkStatus
		elsif(result["status"] == "error")
			@status = -1 
		end 

		@status
	end 
	


	def loadPlan(state_data = nil)
		if(@status!=2) 
			puts "planner not initialized"
			return  {"status" => "planner not initialized"}.to_json
	
		end
	
		http = build_uri("fetch_plan")  
		
		#uri = URI("http://www.google.com/")
		headers = { }
		if(state_data==nil)
			state = File.read("./test_plan.txt")
		
		else
			state = state_data
		end	
		
		puts "state :"+ state
	#	body = "step="+step.to_s+"&state="+state
		body = "data="+state
		response = http[0].post(http[1].path,body,headers) 

		puts response.body 
		response.body
	end 
		
end
