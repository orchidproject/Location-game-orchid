class Game
  include DataMapper::Resource
  
  property :name, String
  property :address, String, :length => 255
  property :latitude, String
  property :longitude, String
  property :radius, String
  property :layer_id, Serial, :index => true
  property :sim_lng, Decimal, :precision=>10, :scale=>7
  property :sim_lat, Decimal, :precision=>10, :scale=>7
  property :grid,String, :default => "" 
  
  property :template, Integer, :default => 0
  property :is_active, Integer, :default => -1
  property :created_at, DateTime
  property :updated_at, DateTime
  has n, :teams
  has n, :players
  has n, :tasks
  has n, :dropoffpoints
    
  def self.team_names
    %w{runner controller truck}
  end

  after :create do
    self.class.team_names.each {|color| teams.create :name => color}
  end

  def pick_team(name)
  	# At this point we can be sure there are already 2 teams in the game since the game
  	# was created in the "/games/:layer_id/join"
    # team = (teams.first.players.count < teams.last.players.count ? teams.first : teams.last)
     
      team= teams.first :name=>name
  end
  
  def total_points
    total_array = self.class.team_names.collect! {|team_name| points_for(team_name)}
    total = 0
    total_array.each {|t| total += t}
    total
  end
  
  def points_for(team)
    points = teams.first(:name => team).players.collect {|player| player.points_cache}
    total = 0
    points.each {|p| total += p}
    total
  end
	
  def broadcast(socketIO,signal)
  	socketIO.broadcast( 
                           { 
                           :channel=> self.layer_id,             
                           :data=>{
                           :system=>signal
                           }
                           }.to_json)
  
  
  end 
  
end
