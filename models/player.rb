class Player
    
  @@skill = ["medic","firefighter","soldier","transporter"]
    
    
    
  include DataMapper::Resource
  property :id, Serial, :index => true
  
  property :points_cache, Integer, :default => 0
  property :profile_image, String, :length => 255
  property :name, String
  property :created_at, DateTime
  property :updated_at, DateTime
  property :exposure, Float, :default => 0.0
  property :current_exposure,Float ,:default => 0.0
  property :latitude, Decimal, :precision=>10, :scale=>7   
  property :skill, Integer
  property :health, Integer,:default => 100
  property :longitude, Decimal, :precision=>10 , :scale=>7  
  property :current_task, Integer,:default => -1
  property :initials, String, :length => 255
  property :status, String, :default => "normal"
  belongs_to :game
  
  #lagecy 
  belongs_to :team
  has n, :readings
  has n, :cargos
  has n, :requests
  
  
  def skill_string()
  	return @@skill[self.skill]
  
  end 

  def add_points(points)
    update :points_cache => (self.points_cache + points.to_i)
    reload
  end

  def update
  	self.health=100-(self.exposure/10)
  	
  
  end 
  
  def distance_to(lat,lng)
  	  #for approxi check
  	  location1 = Geokit::LatLng.new lat, lng
  	  location2 = Geokit::LatLng.new self.latitude, self.longitude
  	  return (location1.distance_to location2, :units => :kms)*1000
  	
  end 
  
  
  
  def broadcast(io)
  	
      io.broadcast( 
                         { 
                         :channel=> self.game.layer_id,             
                         :data=>{
                            :player=>{
                                :id=> self.id,
                                :name=> self.name,
                                :skill => skill_string(),
                                :initials => self.initials,
                                :status => self.status
                            }
                         }
                    }.to_json)   
  end 
    
  def broadcast_health(io)
        io.broadcast( 
                     { 
                        :channel=> "#{self.game.layer_id}-2",  
                        :users=>[self.id], #send to a particular user
                        :data=>{
                            :health=>{
                                :player_id => self.id,
                                :value => self.health
                            }
                        }
                     }.to_json)   
  end 
  
  def broadcast_acc_exposure(io)
        io.broadcast( 
                     { 
                        :channel=> "#{self.game.layer_id}-2", 
                        :users=>[self.id], #send to a particular user
                        :data=>{
                            :acc_exposure=>{
                                :player_id => self.id,
                                :value => self.exposure
                            }
                        }
                     }.to_json)   
  end 
  
  def broadcast_curr_exposure(io)
        io.broadcast( 
                     { 
                        :channel=> "#{self.game.layer_id}-2", 
                        :users=>[self.id], #send to a particular user
                        :data=>{
                            :exposure=>{
                                :player_id => self.id,
                                :value => self.current_exposure
                            }
                        }
                     }.to_json)   
  end 

end
