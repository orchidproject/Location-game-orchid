data = File.read("./lib/scripts/session/formal-test.json")
data = JSON.parse(data)
game = Game.create(:latitude => 52.952617, :longitude=> -1.188639,
	:radius => 1000,
	:sim_lat => data["sim_lat"],
	:sim_lng => data["sim_lng"],
	:sim_update_interval => data["sim_update_interval"],
	:simulation_file => data["simulation_file"],
	:terrains => data["terrains"].to_s
) 

=begin
data["players"].each do |p|
	game.players.create(
		:name => "name",
		:initials => p["initials"], 
		:skill => p["skill"], 
		:health => p["health"],	
		:longitude => p["longitude"],
		:latitude => p["latitude"],
		:team_id => 1,
		:current_task => -1,
		:status => p["status"]
	) 
end
=end

count = 0
data["tasks"].each do |p|

	game.tasks.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:type =>p["type"],
		:state =>4,
		:players => p["players"],
		:shared_id => count
	) 

	count+=1
end

data["dropoffpoints"].each do |p|
	game.dropoffpoints.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:radius => p["radius"]
	)

end

