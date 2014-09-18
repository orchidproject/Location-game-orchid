data = File.read("./lib/scripts/session/formal.json")
data = JSON.parse(data)
game = Game.create(:latitude => 18.5, :longitude=> -72,
	:radius => 1000,
	:sim_lat => data["sim_lat"],
	:sim_lng => data["sim_lng"],
	:sim_update_interval => data["sim_update_interval"],
	:simulation_file => data["simulation_file"],
	:terrains => data["terrains"].to_s,
	:grid_size => data["grid_size"].to_i
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

	task = game.tasks.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:type =>p["type"],
		:state => 3,
		:players => p["players"]
	) 
	task.shared_id = p["shared_id"]
	task.save
	
end

data["dropoffpoints"].each do |p|
	game.dropoffpoints.create(
		:latitude => p["latitude"] ,
		:longitude =>p["longitude"],
		:radius => p["radius"]
	)

end

