require "./jsonLoader"
require "json"

class StateBreakdown

	def intialize(data)
		@state = data
	end

end


class UpdateAgregate
	def initalize(intialState, data, updateInterval)
		@updates = data
		@initialGameState = initialState 
		@interval = updateInterval	
	end

	def covert(start)
		output = []
		output << {:time_frame => 0 , :state => @initalGameState}
		pGameState = Marshal.load(Marshal.dump(@initialGameState)) # deep copy 
		time_frame = 1
		
		baseTimeStamp = nil 
		@updates.each do |update|
			if !baseTimeStamp	
				baseTimeStamp = update.time_stamp
			else
				update.time_stamp > baseTimeStamp + @interval*time_frame 
				time_frame++
				output << {:time_frame => time_frame , :state => Marshal.load(Marshal.dump(pGameState))}
				
			end 
				
			#only care about task and location now
			if update[:task] 
				updateTask(pGameState,update[:task])
			end 

			if update[:location]
				
			end 
		end	
		return converted.to_s			
	end

	private 
	def updateTask(state,update)
		state[:tasks].each do |t|
			if(t[:id] == update[:id]}	
				t[:x] = update[:x]	
				t[:y] = update[:y]
			end
		end
	end 
	
	def updatePlayers(state,update)
		state[:tasks].each do |t|
			if(t[:id] == update[:id]}	
				t[:x] = update[:x]	
				t[:y] = update[:y]
			end
		end
	end 
end

loader = AtomicOrchidJsonLoader.new("merged_data")
data = loader.load
stateLoader = StateJsonLoader.new("")i
state = stateLoader.load
UpdateAggregate.new(state,date,12000)




