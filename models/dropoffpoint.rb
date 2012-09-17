class Dropoffpoint
    
  include DataMapper::Resource
  property :id, Serial, :index => true
  property :radius, Integer, :default => -1
  property :latitude, Decimal, :precision=>10, :scale=>7 
  property :longitude, Decimal, :precision=>10 , :scale=>7 
  belongs_to :game
  
  
  def distance_to(lat,lng)
  	  #for approxi check
  	  location1 = Geokit::LatLng.new lat, lng
  	  location2 = Geokit::LatLng.new self.latitude, self.longitude
  	  return (location1.distance_to location2, :units => :kms)*1000
  	
  end 
  
end 