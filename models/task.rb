class Task
  
  module State
    PICKED_UP = 1
    DROPPED_DOWN = 2
    IDLE = 3
    UNSEEN = 4
    Invalidated = 5
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
 

  property :shared_id, Integer

  property :type, Integer
  property :id, Serial
  property :created_at, DateTime
  property :updated_at, DateTime
  belongs_to :game
    
  property :description, String, :length => 255
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7
  property :players, String, :length => 255, :default => ""
  
  property :state, Integer, :default=> State::UNSEEN
# has n, :players
    
  def requirement
    puts self.type 
    return @@task_type[self.type]
  end

  def pick_type
    
    self.type = (self.id)%4
    puts self.type
    self.save
  end
    
  def update(socket)
  
  state_change = {:before=> self.state, :after=>nil}
  
    if self.state==State::UNSEEN
      if(reveal)
        self.broadcast(socket)
      end

    elsif self.state==State::IDLE
      current_state = Array.new(@@task_type[self.type].length){ |i| 0 }
      eligiable_players = []
      
      self.game.players.each do |p|
        next if p.skill == 4
        if (p.distance_to self.latitude, self.longitude) <20 #approxi check
          puts "player nearby detected #{p.distance_to self.latitude, self.longitude} task: #{p.current_task}"
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
        #puts "distance: #{p.distance_to self.latitude, self.longitude}"
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
        self.players=""
        eligiable_players.each do |p|
          p.current_task=self.id
          if (self.players=="")
            self.players="#{p.id}"
          else
            self.players="#{self.players},#{p.id}"
          end 
          
          p.save
        end
      end
      
    elsif self.state==State::PICKED_UP
      
      lat=0
      lng=0
      dropped_off=false
      working_players= game.players.all :current_task=> self.id
      
      working_players.each do |w|
        lat=lat + w.latitude
        lng=lng + w.longitude
      end
      
      self.latitude=lat/working_players.length
      self.longitude=lng/working_players.length
      
      
      
      #distance check, if one player goes too far, then task dropped off, 25 meter 
      working_players.each do |p|
        if (p.distance_to(self.latitude,self.longitude) > 25)
          dropped_off=true
        end 
      end 
      
      if dropped_off
        #set the players
        self.players=""
        self.state=State::IDLE
      
        working_players.each do |p|
          p.current_task=-1
          p.save
        end
        
      end
      
      #should check wether it is save area now
      drop_off_in_safe=false
      self.game.dropoffpoints.each do |d|
        if d.distance_to(self.latitude, self.longitude)<d.radius
            drop_off_in_safe=true
        end
      end
    
      if drop_off_in_safe
        self.players=""
        working_players.each do |p|
          p.current_task=-1
          p.save
        end
        
        self.state=State::DROPPED_DOWN
      end 
      
      
      #broadcast
      self.broadcast(socket)
  
    end

    self.save 
    state_change[:after] = self.state 
    return  state_change
  end 
  
  def reveal
    self.game.players.each do |p|      
      next if p.skill == 4
      if (p.distance_to self.latitude, self.longitude) <50 #approxi check
        self.state=State::IDLE
        return true
      end
    end
    return false
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
                :state => self.state,
                :players => self.players
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

  def invalidate 
    socket.broadcast(
         { 
            :channel=> self.game.layer_id,     
            :data=>{          
            :textMessage=>{
                  :content=>"Task invalidated",
                  :player_initials=>"CO",
                  :player_name=>"controller",
            }
      }
    }.to_json)
  end

end

