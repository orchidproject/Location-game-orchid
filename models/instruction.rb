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
  property :path, String, :length => 5000
  property :status, Integer, :default=>1 
  #1 idle, 2 rejected, 3 accept
  before :save do
	puts "before save hooker"
  end   

  def validate
	if (getTeammate == -1 && task_id != -1)
		return false
	else
		return true
	end	
  end  

  def getTeammate
	#get teammate
	teammate = -1	
	#be defensive for different ruby versions	
	if(self.group!= "" && self.group != "null" && self.group != nil)
		#ßputs "the thing that needs to be parsed:" + self.group
		the_group = JSON.parse(self.group)
		the_group.each do |id|
			if (id.to_i == self.player_id.to_i)
				next	
			else 
				teammate = id.to_i
			end 
		end 
	end 
	return teammate
  end 

  def equals(other)
	if( player_id != other.player_id)
		return false
	end 

	if ( task_id != other.task_id) 
		return false
	end
 
	if ( task_id == -1 && other.task_id == task_id)
		return true
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

  

  def output
	
	{
		:teammate=> getTeammate,
		:task=> self.task_id, 
		:direction=> self.action,
		:status => self.status,
		:time => self.created_at.to_time.to_i,
		:id => self.id,
		:player_id => self.player_id,
		:frame_id => self.frame.id
	}
	

  end 

end 
