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
  property :status, Integer, :default=>1 

  before :save do
	puts "before save hooker"
  end   

  def equals(other)
	if( player_id != other.player_id)
		return false
	end 
	groupArray =  JSON.parse(group)
	other_groupArray =  JSON.parse(other.group)	
	groupArray.each do |p|
		marched  = false
		other_groupArray.each do |op|
			if p == op	
				marched = true
			end
		end 
		if !marched 
			return false
		end 
	end 	
	
	return true 
  end 

end 
