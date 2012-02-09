class Cargo
  include DataMapper::Resource
  property :id, Serial
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  property :created_at, DateTime
  property :radius, Integer
  property :exposed, Boolean
  belongs_to :player
 

end
