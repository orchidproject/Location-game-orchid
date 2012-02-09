class Reading
  include DataMapper::Resource
  property :id, Serial
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  property :created_at, DateTime
  property :updated_at, DateTime
  property :value, String
  belongs_to :player
 

end
