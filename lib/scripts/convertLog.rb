require "./jsonLoaders.rb"
require "json"

class StateBreakdown

	def initialize(data,updateInterval)
		@states = data
		@interval = updateInterval
		
		@roleMapping =  ["medic","firefighter","soldier","transporter"]
		@taskMapping =  ["radioactive","animal","victim","fuel"]
	end
	
	def convert(convertMapping)
		output = [] 
		@states.each do |state|
			puts state
			artificialTimeStamp = @interval*state["time_frame"]	
=begin try to add player object 
			if (state["time_frame"]==0)
				state["state"]["players"].each do |p|
					output << {"player" => p, "time_stamp" => artificialTimeStamp }
				end 
			end
=end

			state["state"]["players"].each do |p|
				p["skill"] = @roleMapping[ p["skill"]]
				p["name"] = "agent"
				p["initials"] = "AG"
				output << {"health" => {"player_id" => p["player_id"], "value" => p["health"]},  "time_stamp" => artificialTimeStamp}
				p.delete("health")
				output << {"location" => p, "time_stamp" => artificialTimeStamp }
				
			end 

			state["state"]["tasks"].each do |t|
				output << {"task" => t, "time_stamp" => artificialTimeStamp }

			end
		end
	
		return output_to_string(output)
	end	

	private
	def output_to_string(output)
		string_output = ""
		count = 0 
		output.each do |update|
			count += 1 
			puts "convert to string " +  count.to_s  + "/" + output.length.to_s
			string_output = string_output + update.to_json + "\n"
		end 

		return string_output
	end 

end


class UpdateAgregator
	def initialize(initialState, data, updateInterval)
		@updates = data
		@initialGameState = initialState 
		@interval = updateInterval	
		
	end

	def convert(start)
		output = []
		pGameState = Marshal.load(Marshal.dump(@initialGameState)) # deep copy 
		output << {"time_frame" => 0 , "state" => pGameState}
		time_frame = 1
		
		baseTimeStamp = nil 
		@updates.each do |update|
			if !baseTimeStamp	
				baseTimeStamp = update["time_stamp"]
				puts baseTimeStamp
			else
				if update["time_stamp"] > (baseTimeStamp.to_i + @interval*time_frame)
					time_frame+=1
					puts time_frame
					clone = Marshal.load(Marshal.dump(pGameState)) 
					output << {"time_frame" => time_frame , "state" => clone }
				end	
			end 
				
			#only care about task and location now
			if update["task"] 
				
				updateTask(pGameState,update["task"])
			end 

			if update["location"]
				updatePlayer(pGameState,update["location"])

			end 
			
			if update["health"]
				updateHealth(pGameState,update["health"])
			end
		end	
		return output.to_json			
	end

	private 
	def updateTask(state,update)
		state["tasks"].each do |t|
			if(t["id"] == update["id"])	
			#	puts "task updated"
				t["x"] = update["x"]	
				t["y"] = update["y"]
				t["state"] = update["state"]
				t["players"] = update["players"]
			end
		end
	end 
	
	def updatePlayer(state,update)
		state["players"].each do |p|
			if(p["id"] == update["player_id"].to_i)	
		#		puts "player updated"
				p["x"] = update["x"]	
				p["y"] = update["y"]
				p["status"] = update["status"]
			end
		end
	end 

	def updateHealth(state,update)
		state["players"].each do |p|
			if(p["id"] == update["player_id"])	
			#	puts "health updated"
				p["health"] = update["value"]
			end
		end
	end 
	
end


=begin 
loader = AtomicOrchidJsonLoader.new("game_log_converted")
data = loader.load
stateLoader = GameStateJsonLoader.new("game_state.txt")
state = stateLoader.load
state.delete("terrains")
state.delete("dropoffpoints")
aggregator = UpdateAgregator.new(state,data,6000)
res = aggregator.convert(true)

File.open("converted.json","w") { |f| f.write(res) }
=end 

loader = GameStateJsonLoader.new("feng.txt")
data = loader.load
breakdown =  StateBreakdown.new(data,12000)
res = breakdown.convert(true)
File.open("breakdown.json","w") { |f| f.write(res) }
