class Plan

  include DataMapper::Resource
  property :id, Serial, :index => true
  property :created_at, DateTime
  property :updated_at, DateTime
  property :step, Integer 

  belongs_to :game
  has n, :frames 


  def notifyPlayers(io)
	puts "notify users"
	first_frame = frames.first(:count => 0)
	first_frame.instructions.each do |instruction|	
		#get teammate
		io.broadcast( 
                     { 
                        :channel=> "#{self.game.layer_id}-2",  
                        :users=>[instruction.player_id], #send to a particular user
                        :data=>{
                            :instructions=>[{
                                :teammate=> 58,
                                :task=> instruction.task_id, 
				:direction=> instruction.action,
				:status => 1,
				:time => instruction.created_at.to_time.to_i
                            }]
                        }
                     }.to_json)   
	end
  end 

end 
