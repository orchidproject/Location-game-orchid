class Plan

  include DataMapper::Resource
  property :id, Serial, :index => true
  property :created_at, DateTime
  property :updated_at, DateTime
  property :step, Integer 

  belongs_to :game
  has n, :frames 


def notifyPlayers(io)
	
	first_frame = frames.first

  count =0 
	first_frame.instructions.each do |instruction|	
    path = nil
    if instruction.path != nil && instruction.path != "null"
      puts instruction.path + "hehehehehe"
      path = JSON.parse(instruction.path)
    else
      path = []
    end

		io.broadcast( 
          { 
              :channel=> "#{self.game.layer_id}-2",  
              :users=>[instruction.player_id,instruction.getTeammate], #send to a particular user
                  :data=>{
                            :instructions=>[{
                                :teammate=> instruction.getTeammate,
                                :task=> instruction.task_id, 
				                        :direction=> instruction.action,
				                        :status => instruction.status,
			                          :path => path,
				                        :id => instruction.id,
				                        :player_id => instruction.player_id,
                                :frame_id => instruction.frame.id,
                                :frame_size => first_frame.instructions.size,
                                :confirmed => 0
                            }]
                  }
              }.to_json) 

     
  end
end 

def output 
	result = {:step => self.step , :frames => []} 
	self.frames.each do |f|
		result[:frames]<< f.output	
	end 	
	result
  end 
end 
