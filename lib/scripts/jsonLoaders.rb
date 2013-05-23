class AtomicOrchidJsonLoader 
	def initialize(filename) 
		data = File.read(filename)
		@records = data.split("\n")
	end 

	def load
		parsed = []
		@records.each_with_index do |item,index|
			puts "loading json " + (index+1).to_s + "/" + @records.length.to_s
			begin 	
				parsed_item = JSON.parse(item)	
			rescue	
				puts "invalid json skipped"
				next
			end
			parsed << parsed_item		
		end
		return parsed
	end 
end 


class GameStateJsonLoader
	def initialize(filename)
		@data = File.read(filename)
	end 
	
	def load
		return JSON.parse(@data)
	end 

end 
