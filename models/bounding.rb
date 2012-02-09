class Bounding
  include DataMapper::Resource
  property :id, Serial
  property :swLatitude, Decimal, :precision=>10, :scale=>7
  property :swLongitude, Decimal, :precision=>10, :scale=>7
  property :neLatitude, Decimal, :precision=>10, :scale=>7
  property :neLongitude, Decimal, :precision=>10, :scale=>7
    
  property :created_at, DateTime
  property :updated_at, DateTime
  belongs_to :game

end