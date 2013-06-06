require 'uri'
require 'net/http'

uri = URI("http://202.141.161.27/atomic/")
#uri = URI("http://www.google.com/")
http = Net::HTTP.new(uri.host, uri.port)
headers = { }
state = File.read("./game_state_v1.txt")
puts "state :"+ state
body = "step=10&state="+state
response = http.post(uri.path,body,headers) 
puts response.body
