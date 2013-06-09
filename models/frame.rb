class Frame 

  include DataMapper::Resource
  property :id, Serial, :index => true
  property :created_at, DateTime
  property :updated_at, DateTime
  property :count, Integer 
  belongs_to :plan    
  has n, :instructions
end 
