require "json" 


#have dropoff -> no dropoff.... no dropoff -> have dropoff
class PlanInterpretor
	
	def initialize(file)
		raw_plan = File.read(file)
		@plans = JSON.parse(raw_plan)["plan"]	
	end 

	def get_events 
		events = []
		@plans.each_with_index do  |value,index|
			if index==0 
				next
			end
			events.concat compare_frame @plans[index-1], value 
		end 
		puts "["
		events.each_with_index do  |e,index|
			if index == events.length-1 
				puts e.to_json 
			else
				puts e.to_json + ","
			end
		end 
		puts "]"
	end 

	private 
	#compare frames to elaborate events 
	def compare_frame(frame1, frame2 )
		events = []
			
		frame2["players"].each do |i2|
			i1 = get_instruction_by_player_id(frame1, i2["id"])
			i2["time_frame"] = frame2["time_frame"] 
			i1["time_frame"] = frame1["time_frame"] 
			event = build_event(i1 , i2)	
			if event == "dropped off"
				events << { "action" => event , "detail" => i1 }		
			elsif event == "picked up"
				events << { "action" => event , "detail" => i2 }		
			end 
		end 
		events 
	end 

	def build_event(i1, i2) 

		if ( i1["status"] == 3 and  i2["status"] == 1 ) 
			return "picked up"	
		elsif ( i1["status"] == 1 and  i2["status"]==3 ) or  ( i1["status"] == 1 and  i2["status"].nil? ) 
			return "dropped off"
		else
			return nil
		end	
	end 

	def compare_instructions(i1, i2)
		if (i1["task"] == i2["task"] or ( i1["task"] < 0 and  i2["task"] < 0 ))and i1["id"] == i2 ["id"] 
			return true
		end 
		false
	end 

	def get_instruction_by_player_id (frame, player_id)
		frame["players"].each do |i|
			return i if i["id"] == player_id
		end 
	end 

end 

class InstructionInterprator
	def initialize(file)
		raw_log = File.read(file)
		raw_log = raw_log.split("\n")
		@actions  =  []
		raw_log.each do |log|
			#get rid of empty log
			json_log = JSON.parse(log) if log != ""
			@actions << json_log 	
		end
		@base_time = @actions[0]["time_stamp"] 
		@interval = 60*1000*0.2

	end

	def get_event

	end 


end 


class LogEvents
	def initialize(file)
		raw_log = File.read(file)
		raw_log = raw_log.split("\n")
		@actions  =  []
		raw_log.each do |log|
			#get rid of empty log
			json_log = JSON.parse(log) if log != ""
			@actions << json_log 	
		end
		@base_time = @actions[0]["time_stamp"] 
		@interval = 60*1000*0.2
		puts @base_time
	end 

	def get_events
		prev_tasks = {}	
		events = []
		tasks =  get_tasks
		tasks.each do |t| 
			time_stamp = t["time_stamp"]
			t = t["task"]
			unless prev_tasks.has_key?(t["id"])
				prev_tasks[t["id"]] = t
				if t["state"] == 1	
					event = {}
					event["action"] = "picked up"
					event["task"] = t
					e1, e2 = split_event event
					events << e1 
					events << e2
				end
			else
				event1, event2  = build_event prev_tasks[t["id"]], t , time_stamp
				events << event1 unless event1.nil?	
				events << event2 unless event2.nil?	
				prev_tasks[t["id"]] = t
			end	
		end

		puts "["
		events.each_with_index do  |e,index|
			if index == events.length-1 
				puts e.to_json 
			else
				puts e.to_json + ","
			end
		end 
		puts "]"
	end

	private
	def get_tasks	
		tasks = []
		@actions.each do |action|
			tasks << action if action.has_key?("task")	
		end 
		tasks
	end

	def build_event(t1, t2, time)
		event = {}
		state1 = t1["state"] 
		state2 = t2["state"]

		return nil if state1 == state2 
		event["time_frame"] = ((time  - @base_time )/@interval).to_i
		if  state1 == 3 and state2 == 1 
			event["task"] = t2 
			event["action"] = "picked up"	
		elsif state1 == 1 and state2 == 2
			event["task"] = t1 
			event["action"] = "dropped off"	
		elsif state1 == 1 and state2==3	
			event["task"] = t1 
			event["action"] = "discarded"	
		else
			event = nil 
		end	

		return  split_event event
	end 	

	def split_event(e)
		players = e["task"]["players"].split ","
			e1 = {"action" => e["action"], "detail" => {"id" => players[0].to_i , "task" => e["task"]["id"], "time_frame" => e["time_frame"] } }
			e2 = {"action" => e["action"], "detail" => {"id" => players[1].to_i , "task" => e["task"]["id"], "time_frame" => e["time_frame"] } }	
		return e1, e2
	end

end



case ARGV[1]

when "1" 
	p = PlanInterpretor.new(ARGV[0])
	p.get_events
when "2" 
	p = LogEvents.new(ARGV[0])
	p.get_events
when "3"
	p = InstructionInterperator.new(ARGV[0])
	p.get_events
else
	puts "wrong argument #{ARGV[1]}, please specify action"
end 

