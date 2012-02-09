require "geokit"

class Request
  include DataMapper::Resource
  property :id, Serial
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  property :value, Integer
  property :radius, Integer 
  property :created_at, DateTime
  property :updated_at, DateTime
  belongs_to :player
    
  def inRange(lat,lng)
        location= Geokit::LatLng.new lat, lng
        selflocation= Geokit::LatLng.new latitude, longitude
        temp_distance=location.distance_to selflocation, {:units=>:kms}
        temp_distance=temp_distance*1000
        
        if temp_distance<=radius
            return true
        else
            return false
        end
  end
  
      #TODO
  def toJson()
      return {:id => id, latitude => latitude, :longitude=>longitude, :value=>value, :player_id=>player.id, :radius=>radius}
  end

end