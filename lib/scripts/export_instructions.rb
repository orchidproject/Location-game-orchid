game = 9 
Plan.all(:game_layer_id=>game).frames.instructions.each do |instruction|
  if instruction.frame.confirmed_plan_id != 0
    next
  end 

  hash = {}
  hash[:id] = instruction.id
  hash[:plan_id] = instruction.frame.plan_id 
  hash[:task_id] = instruction.task_id
  hash[:play_id] = instruction.player_id
  hash[:group] = instruction.group
  puts hash.to_json
end

ConfirmedPlan.all(:game_layer_id=>game).frames.instructions.each do |instruction|
  hash = {}
  hash[:id] = instruction.id
  hash[:confirmed_plan_id] = instruction.frame.confirmed_plan_id 
  hash[:previous_plan_id] = instruction.frame.plan_id 
  hash[:task_id] = instruction.task_id
  hash[:play_id] = instruction.player_id
  hash[:group] = instruction.group
  hash[:status] = instruction.status
  hash[:status] =3 if hash[:status] == 4
  puts hash.to_json
end
