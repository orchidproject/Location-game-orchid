require './plan-handler.rb'

fetch_data = File.read("./fetch_test_data.txt")
update_data = File.read("./update_test_data.txt")

p = PlanHandler.instances(1)
p.pushFetchTask(fetch_data) do |data| 
	puts "finished type1" 
end 
p.pushFetchTask(fetch_data) do |data| 
	puts "finished type1" 
end
puts "main thread sleep ............................."
sleep 30
puts "main thread quit ............................."


