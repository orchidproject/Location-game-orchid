class Player
  include DataMapper::Resource
  property :id, Serial, :index => true
  property :status, Integer, :default => -1
  property :points_cache, Integer, :default => 0
  property :profile_image, String, :length => 255
  property :name, String
  property :email, String, :length => 255
  property :created_at, DateTime
  property :updated_at, DateTime
  
    
  belongs_to :team
  belongs_to :game
  has n, :readings
    
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  has n, :cargos
    
  has n, :requests

  def add_points(points)
    update :points_cache => (self.points_cache + points.to_i)
    reload
  end
end
