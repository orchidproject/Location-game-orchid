class Radiation
  include DataMapper::Resource
  property :id, Serial
  property :latitude, Decimal, :precision=>10, :scale=>7
  property :longitude, Decimal, :precision=>10, :scale=>7
  property :created_at, DateTime
  property :radius, Integer
  property :exposed, Boolean
  property :movement_speed, Decimal, :precision=>2, :scale=>2 #don't know what scale is?
  property :direction_vector, Decimal, :precision=>2, :scale=>2
  belongs_to :game #not sure this is right?
 
  # contaminatedArea = Circle.new(:radius, :latitude, :longitude)
#   collectWasteArea = Circle.new(:radius+10, :latitude, :longitude)
#   readingArea = Circle.new(:radius+50, :latitude, :longitude)
# 
# class Circle
# 	include Comparable
# 
# def initialize(radius, lat, lng)
# 	@radius = radius
# 	@lat = lat
# 	@lng = lng
# end
# 
# def calCircleArea()
# 	return 3.14159*(@radius*@radius)
# end
# 
# def <=>(circle)
# 	area=calCircleArea()
# 	otherArea=circle.calCircleArea()
# 	if area == otherArea
# 		return 0
# 	elsif area < otherArea
# 		return -1
# 	else
# 		return 1
# 
# end
# 
# end

end