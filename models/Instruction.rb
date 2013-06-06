class Instruction 

  include DataMapper::Resource
  property :id, Serial, :index => true
  property :created_at, DateTime
  property :updated_at, DateTime
  property :count, Integer 
  belongs_to :frame

  property :group, String
  property :player_id, Integer
  property :task_id, Integer
  property :next_x, Integer
  property :next_y, Integer
  property :action, String
 

  before :save do
	puts "before save hooker"
  end   
end 
