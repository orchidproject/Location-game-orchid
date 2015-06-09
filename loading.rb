require 'json' 

Task.all.destroy
Player.all.destroy
Instruction.all.destroy

contents = File.read('./target.json') 
puts contents 
data = JSON.parse(contents) 
g = Game.get(1) 

data.each do |d|
  t = g.tasks.create( :latitude => d["lat"] ,:longitude => d["lng"] , :shared_id => d["id"] , :type=> d["targetType"] , :state => 3  ) 
end

g = Game.get 1
g.is_active = -1
g.save


