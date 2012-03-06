class Task

 include DataMapper::Resource 

    #@@task_type={
    #:Patient=>['ambulance','medic'],
    #:Fueldump=>['transporter','soldier'],
    #:Animal=>['transporter','soldier'],
    #:Radioactive=>['transporter','soldier']
    #}
    
    @@task_type=[
        ['ambulance','medic'],
        ['transporter','soldier'],
        ['transporter','soldier'],
        ['transporter','soldier']
    ]
 
  property :type, Integer
  property :id, Serial
  property :created_at, DateTime
  property :updated_at, DateTime
  belongs_to :game
    
  property :description, String, :length => 255
  property :status, String, :default=> "inactive" #completed active inactive 
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10 , :scale=>7

#  has n, :players
    
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
    
  def broadcast(socket)
      
  end
  

end

