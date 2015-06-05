require 'json' 

contents = File.read('./target.json') 
puts contents 
data = JSON.parse(contents) 
g = Game.get(1) 

data.each do |d|
  t = g.tasks.create( :latitude => d["lat"] ,:longitude => d["lng"] , :shared_id => d["id"] , :type=> d["targetType"] , :state => 4  ) 
end
