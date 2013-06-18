
data = File.read("./lib/scripts/game_state.txt")
data = JSON.parse(data)
game = Game.create(:latitude => 52.952617, :longitude=> -1.188639,
	:radius => 1000,
	:sim_lat => data["sim_lat"],
	:sim_lng => data["sim_lng"],
	:sim_update_interval => data["sim_update_interval"],
	:simulation_file => data["simulation_file"],
	:terrains => data["terrains"].to_s
) 


data["players"].each do |p|
	game.players.create(
		:name => "name",
		:initials => "AA", 
		:skill => p["skill"], 
		:health => p["health"],	
		:longitude => p["longitude"],
		:latitude => p["latitude"],
		:team_id => 1,
		:current_task => -1,
		:status => p["status"]
	) 
end

data["tasks"].each do |p|
	game.tasks.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:type =>p["type"],
		:state =>p["state"],
		:players => p["players"]
	) 

end

data["dropoffpoints"].each do |p|
	game.dropoffpoints.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:radius => p["radius"]
	)

end

