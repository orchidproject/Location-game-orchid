class Player
    
    #@@skill = ["medic","ambulance","soldier","transporter"]
    
    
    
  include DataMapper::Resource
  property :id, Serial, :index => true
  property :status, Integer, :default => -1
  property :points_cache, Integer, :default => 0
  property :profile_image, String, :length => 255
  property :name, String
  property :email, String, :length => 255
  property :created_at, DateTime
  property :updated_at, DateTime
  property :exposure, Float, :default => 0.0
  property :current_exposure,Float ,:default => 0.0
  property :latitude, Decimal, :precision=>10, :scale=>7   
  property :skill, Integer
  property :health, Integer,:default => 100
  property :longitude, Decimal, :precision=>10 , :scale=>7  
  
    
  belongs_to :team
  belongs_to :game
  has n, :readings
  has n, :cargos
    
  has n, :requests


  def add_points(points)
    update :points_cache => (self.points_cache + points.to_i)
    reload
  end
    
  def broadcast(io)
      io.broadcast( 
                         { 
                         :channel=> self.game.layer_id,             
                         :data=>{
                            :player=>{
                                :id=> self.id,
                                :name=> self.name,
                                :points_cache => self.points_cache,
                                :team => self.team.name,
                                :skill => self.skill
                            }
                         }
                    }.to_json)   
  end 
    
  def broadcast_health(io)
        io.broadcast( 
                     { 
                        :channel=> self.game.layer_id,             
                        :data=>{
                            :health=>{
                                :player_id => self.id,
                                :value => self.skill
                            }
                        }
                     }.to_json)   
  end 

end
