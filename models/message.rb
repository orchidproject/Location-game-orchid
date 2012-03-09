class Message
  include DataMapper::Resource
  property :id, Serial
  property :content, String
  belongs_to :pm
 
end
