class Task
  #
  module State
    PICKED_UP = 1
    DROPPED_DOWN = 2
    IDLE = 3
  end

 include DataMapper::Resource 

    #@@task_type={
    #:Radioactive=>['transporter','soldier']
    #:Patient=>['ambulance','medic'],
    #:Fueldump=>['transporter','soldier'],
    #:Animal=>['transporter','soldier'],
    
    #}
    
    @@task_type=[
        ['transporter','soldier'],
        ['transporter','medic'],
        ['firefighter','medic'],
        ['firefighter','soldier']
        
    ]
 
  property :type, Integer
  property :id, Serial
  property :created_at, DateTime
  property :updated_at, DateTime
  belongs_to :game
    
  property :description, String, :length => 255
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  
  property :state, Integer, :default=> State::IDLE
# has n, :players
    
  def requirement
    puts "output2"
    puts self.type 
    return @@task_type[self.type]
  end

  def pick_type
    
    self.type = (self.id)%4
    puts "output1"
    puts self.type
    self.save
  end
    
  def update(socket)
  
  	if self.state==State::IDLE
  		current_state = Array.new(@@task_type[self.type].length){ |i| 0 }
  		eligiable_players = []
  		
  		self.game.players.each do |p|
  			
  			if (p.distance_to self.latitude, self.longitude) <10 #approxi check
  				puts "player nearby detected #{p.distance_to self.latitude, self.longitude}"
  				if p.current_task == -1 #player is idle
  					
  					current_state.each_with_index do |i,index| #match skills and requirements
  						if i==0 && @@task_type[self.type][index].eql?(p.skill_string())
  							puts "find eligible player"
  							
  							#modify array in iteration,seem will throw excepation if it is in Java
  							current_state[index]=1
  							puts "#{self.type},#{current_state.to_s}"
  							eligiable_players << p
  							
  						end 
  					end 
  				end 
  			else
  			puts "distance: #{p.distance_to self.latitude, self.longitude}"
  			end
  		end
  		
  		picked_up=true
  		current_state.each do |i|
  			if i==0
  				picked_up=false
  			end
  		end
  		
  		if picked_up
  			self.state=State::PICKED_UP
  			puts "task be picked up"
  			#lock players
  			eligiable_players.each do |p|
  				p.current_task=self.id
  				p.save
  			end
  			self.save
  		end
  		
  	elsif self.state==State::PICKED_UP
  		count=0
  		lat=0
  		lng=0
  		dropped_off=false
  		working_players=[]
  		
  		game.players.each do |p|
  			if p.current_task == self.id
  				count=count+1
  				lat=lat+p.latitude
  				lng=lng+p.longitude
  				#construct working players array
  				working_players << p
  			end
  		end
  		self.latitude=lat/count
  		self.longitude=lng/count
  		
  		
  		self.save
  		
  		
  		#distance check, if one player goes too far, then task dropped off
  		working_players.each do |p|
  			if p.distance_to(self.latitude,self.longitude) > 10
  				dropped_off=true
  			end 
  		end 
  		
  		if dropped_off
  			
  			#should check wether it is save area now
  			drop_off_in_safe=false
  			self.game.dropoffpoints.each do |d|
  				if d.distance_to(self.latitude, self.longitude)<d.radius
  					drop_off_in_safe=true
  					
  				end
  			end
  			
  			if drop_off_in_safe
  				self.state=State::DROPPED_DOWN
  			else
  				self.state=State::IDLE
  			end
  			
  			
  			working_players.each do |p|
  				p.current_task=-1
  				p.save
  			end
  			self.save
  		end
  		
  		#broadcast
  		self.broadcast(socket)
  	end
  	
  end 
  
  def broadcast(socket)
  	socket.broadcast(
      	 { 
            :channel=> self.game.layer_id,     
      		:data=>{
      					  
      		  :task=>{
             	:id => self.id,
             	:type=>self.type,
			 	:requirement=>self.requirement,
             	:description=> self.description,
             	:longitude => self.longitude.to_s('F'),
             	:latitude => self.latitude.to_s('F'),
			 	:state => self.state
			  }
			}
         }.to_json)
      	
  end
  
  def broadcast_state_change(socket,p1,p2)
		targets=[p1,p2]
  		socket.broadcast(
      	 { 
            :channel=> self.game.layer_id,     
      		:data=>{
      					  
      		  :textMessage=>{
             			:content=>"Picked up",
             			:player_initials=>"CO",
             			:player_name=>"controller",
						:target => targets
			  	  }
			}
         }.to_json)
  
  end
  

end

