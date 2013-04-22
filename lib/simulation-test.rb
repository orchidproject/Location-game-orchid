require File.dirname(__FILE__) + '/simulation.rb'

simulation = Simulation.new("simulation_data_03.txt", 52.953664, -1.188509, 8, Time.now, 0.1)
#simulation.visualize(80)

#(1..400).each do |i|
	#simulation.visualize_edge(i)
	#sleep 1
#end

#(2..400).each do |i|
#	simulation.visualize_diff(i)
#	sleep 1
#end

(2..400).each do |i|
	simulation.getIndexedDiffFrame(Time.now)
	sleep 1
end


