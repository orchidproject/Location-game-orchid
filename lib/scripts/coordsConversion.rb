#this is a dirty script with dependency of exsitence of simulation file and datafile called marged data.
#useage ruby [scriptfilename]
require "../simulation.rb"
require 'json'
require "./jsonLoaders.rb"


class CoordsConverter
	def initialize(original_data)
		@data = original_data
		
		@sim = Simulation.new("../../cloud/simulation_data_03.txt",
			52.952617,
			-1.188639,
			8,
			Time.now,
		0.2)
	end
	
	def convert_to_string
		output = ""	
		@data.each_with_index do |item,index|
			puts "processing " + (index+1).to_s + "/" + @data.length.to_s
		
			if item["location"] != nil
				target = item["location"]
			elsif item["task"] != nil
				target = item["task"]
			else 
				output =  "#{output}#{item.to_json}\n"
				next
			end	
			result =  @sim.getGridCoord(Float(target["latitude"]),Float(target["longitude"])) 
			target.delete("latitude")	
			target.delete("longitude")	
			target["x"] = result[:x]	 
			target["y"] = result[:y] 
			#puts record 
			output =  "#{output}#{item.to_json}\n"
	
		end
		return output
	end

	def convert_game_state
		data = @data["players"]
		data.each_with_index do |item,index|
			puts "processing " + (index+1).to_s + "/" + data.length.to_s
		
			
			result =  @sim.getGridCoord(Float(item["latitude"]),Float(item["longitude"])) 
			item.delete("latitude")	
			item.delete("longitude")	
			item["x"] = result[:x]	 
			item["y"] = result[:y] 
	
		end
		return @data.to_json

	end

end

class ReverseCoordsConverter
	def initialize(original_data)
		@data = original_data
		@sim = Simulation.new("../../cloud/simulation_data_03.txt",
			52.952617,
			-1.188639,
			8,
			Time.now,
		0.2)
	end

	def convert_to_string
		output = ""	
		@data.each_with_index do |item,index|
			puts "processing " + (index+1).to_s + "/" + @data.length.to_s
		
			if item["location"] != nil
				target = item["location"]
			elsif item["task"] != nil
				target = item["task"]
			else 
				output =  "#{output}#{item.to_json}\n"
				next
			end	
			result =  @sim.getCoordsFromGrid(target["x"],target["y"]) 
			target.delete("x")	
			target.delete("y")	
			target["latitude"] = result[:lat]	 
			target["longitude"] = result[:lng] 
			#puts record 
			output =  "#{output}#{item.to_json}\n"
	
		end
		return output
	end 
end 
 
#write to new file
loader = GameStateJsonLoader.new(ARGV[0]) 
data = loader.load 
File.open(ARGV[1], 'w') { |file| file.write(CoordsConverter.new(data).convert_game_state) }
