class Frame 

  include DataMapper::Resource
  property :id, Serial, :index => true
  property :created_at, DateTime
  property :updated_at, DateTime
  property :count, Integer 
  belongs_to :plan    
  has n, :instructions


  def output
	result = {:count => self.count, :instructions => []}
	self.instructions.each do |i|
		result[:instructions] << i.output
	end 	
	result
  end 
end 
