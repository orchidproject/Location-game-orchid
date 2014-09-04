class Array3D
    
  def initialize(d1,d2,d3)
    @array3d = Array.new(d1) { Array.new(d2) { Array.new(d3) } }
  end
    
  def [](x,y,z)
    @array3d[x][y][z]
  end
    
  def []=(x,y,z,value)
    @array3d[x][y][z] = value   
  end

  def get2DArray(i)
    @array3d[i]
  end

end

class Simulation

  attr_reader :x_size
  attr_reader :y_size   
  def initialize(filename, lat_top_left, long_top_left, grid_size_in_meters, start_time, time_interval_in_minutes)
          
    f = File.open(filename)
        
    @y_size = Integer(f.readline()) 
    @x_size = Integer(f.readline())
    @t_size = Integer(f.readline())
    
    @GPS_lat_x1=52.9491938
    @GPS_long_y1=-1.2144399
    
    @GPS_lat_x2=52.94539363811494
    @GPS_long_y2=-1.2085589719746395
        
    @start_time = start_time
    @grid_size_in_meters = grid_size_in_meters
    @lat_top_left = lat_top_left
    @long_top_left = long_top_left
    @time_interval_in_minutes = time_interval_in_minutes
        
    @end_time = start_time + @time_interval_in_minutes*@t_size*60

    @data = Array3D.new(@t_size,@x_size,@y_size)
        
    (0..@t_size-1).each { 
      |t| (0..@x_size-1).each { 
        |i| (0..@y_size-1).each { 
          |j| @data[t,i,j]=Float(f.readline())
        }
      }
    } 
        
  end

  def resetStart(start_time)
     @start_time = start_time

  end 

  def setTime(time)
     @start_time = time
  end
    
    def isOnMap(lat, long)
        x = getXIndex(long)
        y = getYIndex(lat)
        if (x < 0) | (x > @x_size-1) | (y < 0) | (y > @y_size-1)
            false
        else
            true
        end
    end
    
    def isBeforeSimulationTime(time)
        (time <=> @start_time) == -1
    end
    
    def isAfterSimulationTime(time)
        (time <=> @end_time) == 1
    end
    
    def getReadingByIndex(y_index, x_index, time)
        @data[getTimeIndex(time),x_index,y_index]
    end
    
    def getReadingByLatLong(lat, long, time)
        @data[getTimeIndex(time),getXIndex(long),getYIndex(lat)]
    end
    
    def getTimeIndex(time)
        Integer((time-@start_time)/60/@time_interval_in_minutes)
    end
    
    def getYIndex(lat)
        Integer((@lat_top_left-lat)*1.1119e+05/@grid_size_in_meters)
    end
    
    
       
    
     def getXIndex(long)
        
        Integer((long-@long_top_left)*Math.cos(@lat_top_left/180*Math::PI)*1.1119e+05/@grid_size_in_meters)
    end
    
    def getLat(y_index)
        @lat_top_left - y_index*@grid_size_in_meters/1.1119e+05
    end
   
 #  def getLat(y_index)
#       lat=y_index/@y_size*(@GPS_long_y2-@GPS_long_y1)+@GPS_long_y1
#       return lat
 #  end
    
    def getLong(x_index)
        @long_top_left + 
        x_index*@grid_size_in_meters/1.1119e+05/Math.cos(@lat_top_left/180*Math::PI)
    end

#   def getLong(x_index)
#       long=x_index/@x_size*(@GPS_lat_x2-@GPS_lat_x1)+@GPS_lat_x1
#       return long
#   end
    
    def getTimeFrame(time)
        @data.get2DArray(getTimeIndex(time))
    end
    
    def getTimeFrameWithLatLng(time)
        temp_array=@data.get2DArray(getTimeIndex(time))
        arrayWithLatLng=Array.new(@x_size) {Array.new(@y_size)}
        
        
        (0..(@y_size-1)).each do |y|
            (0..(@x_size-1)).each do |x|
                lat=getLat(y)
                lng=getLong(x)
                value=getReadingByIndex(y, x, Time.now)
                arrayWithLatLng[x][y]={:value=>value,:lat=>lat,:lng=>lng}
                
            end
        end
        
        return arrayWithLatLng
    end

    #edge detection
    def getFrame(t)
        @data.get2DArray(t)
    end
    
   
    def visualize_edge(frame_number)
        #previous_frame = getFrame(frame_number)
        frame = getFrame(frame_number)
        count=0
        (0..(@y_size-1)).each do |y|
            (0..(@x_size-1)).each do |x|
                value=frame[x][y]
                value=(value/10).floor
                
                if isEdge?(x,y,frame) 
                    print "#{value } "
                    count=count+1
                else
                    print "   "
                end
            end 
            puts "."
        end
        puts "value displayed: #{count}"
    end 
    
    def visualize_diff(frame_number)
        if frame_number==1
            return 
        end
        
        previous_frame = getFrame(frame_number-1)
        frame = getFrame(frame_number)
        count=0
        (0..(@y_size-1)).each do |y|
            (0..(@x_size-1)).each do |x|
                value=frame[x][y]
                previous_value=(previous_frame[x][y]/10).floor
                value=(value/10).floor
                if value != previous_value
                    print "#{value } "
                    count=count+1
                else
                    print "   "
                end
            end 
            puts "."
        end
        
        puts "value displayed: #{count}"
    end
    
    
    def isEdge?(x,y,frame)
        
        if x != 0 && y !=0 && x != @x_size-1 && y != @y_size-1  #ignore the boundary 
            value=(frame[x][y]/10).floor
            if (frame[x-1][y]/10).floor != value
                return true
            end
            if (frame[x+1][y]/10).floor != value
                return true
            end
            if (frame[x][y-1]/10).floor != value
                return true
            end
            if (frame[x][y+1]/10).floor != value
                return true
            end
            if (frame[x+1][y+1]/10).floor != value
                return true
            end
            if (frame[x+1][y-1]/10).floor != value
                return true
            end
            if (frame[x-1][y+1]/10).floor != value
                return true
            end
            if (frame[x-1][y-1]/10).floor != value
                return true
            end
            
        end
        
        return false
    end 

    def getIndexedFrame(frame)
    
        arrayWithLatLng=[]
    (0..(@y_size-1)).each do |y|
                (0..(@x_size-1)).each do |x|
                    lat=getLat(y)
                    lng=getLong(x)
                    value=(@data[frame,x,y]/10).floor
                    arrayWithLatLng<<{:index=>"#{x}-#{y}",:value=>value,:lat=>lat,:lng=>lng}
                end
    end
    arrayWithLatLng
    end 
    
    def getIndexedDiffFrame(time)
        frame_number= getTimeIndex(time)
        
        
        arrayWithLatLng=[]
        
        #if it is the first time, get the initial frame
        if !@previous_time
            (0..(@y_size-1)).each do |y|
                (0..(@x_size-1)).each do |x|
                    lat=getLat(y)
                    lng=getLong(x)
                    value=(getReadingByIndex(y, x, time)/10).floor
                    arrayWithLatLng<<{:index=>"#{x}-#{y}",:value=>value,:lat=>lat,:lng=>lng}
                end
            end
            
            puts "heatmap initial update #{arrayWithLatLng.to_s}"
            @previous_time = time
            return arrayWithLatLng
        end
        
        
        
        #return a nil there is no diff between two frames
        previous_frame_number=getTimeIndex(@previous_time)
        if previous_frame_number==frame_number
            @previous_time = time
            puts "no diff"
            return nil
        end
            
        #caculate diff and return array
        count=0
        (0..(@y_size-1)).each do |y|
                (0..(@x_size-1)).each do |x|
                    lat=getLat(y)
                    lng=getLong(x)
                    
                    previous_value=(getReadingByIndex(y, x, @previous_time)/10).floor
                    value=(getReadingByIndex(y, x, time)/10).floor
                    
                    if value != previous_value 
                        count=count+1
                        arrayWithLatLng<<{:index=>"#{x}-#{y}",:value=>value,:lat=>lat,:lng=>lng}
                    end
                
                end
        end
        puts count
        
        @previous_time = time
        return arrayWithLatLng
        
    end 
    
    #reveal on part of the map
    def getVisibleFrame(time, coordinates)
        frame = []
        
        coordinates.each do |l|
            cell = getGridCoord l.latitude,l.longitude
            if isOnMap(l.latitude,l.longitude)
                #constructNode(cell[:x]+1,cell[:y],time,frame )
                #constructNode(cell[:x]-1,cell[:y],time,frame )
                constructNode(cell[:x],cell[:y],time,frame )
                #constructNode(cell[:x]+1,cell[:y]-1,time,frame )
                #constructNode(cell[:x]-1,cell[:y]-1,time,frame )
                #constructNode(cell[:x],cell[:y]-1,time,frame )
                #constructNode(cell[:x]-1,cell[:y]+1,time,frame)
                #constructNode(cell[:x],cell[:y]+1,time,frame )
                #constructNode(cell[:x]+1,cell[:y]+1,time,frame)
            end
        end

        return frame
    end
    #copy a 
    def constructNode(x,y,frame_number,frame)
         node = nil
         puts x.to_s + " : " + y.to_s
         coords = getCoordsFromGrid(x,y)
         if !(x < 0) | (x > @x_size-1) | (y < 0) | (y > @y_size-1)
            value = (getReadingByIndex(y, x, frame_number)/10).floor
            #really?
            node = {:index=>"#{x}-#{y}",:value=>value,:lat=>coords[:lat],:lng=>coords[:lng]}

         end
         frame << node if !node.nil?
    end

    def constructNodeWithValue(x,y,value)
        coords = getCoordsFromGrid(x,y)
        return {:index=>"#{x}-#{y}",:value=>value,:lat=>coords[:lat],:lng=>coords[:lng]}
    end 

    #temperary method, need to be removed
    def getGridCoord(lat,lng)
        return {:y=>getYIndex(lat), :x=>getXIndex(lng)}
    end 

    def getGridCirclePresentation(lat,lon,radius)
    lat1 = lat/180*Math::PI
    lon1 = lon/180*Math::PI 
    brng = 0    # bearing (in radians), 0 mean go north
    d    = radius   # distance to travel in m
    r    = 6371000      # earth's radius in m
    lat2 =  Math.asin(
            Math.sin(lat1)*Math.cos(d/r) + 
                Math.cos(lat1)*Math.sin(d/r)*Math.cos(brng) 
        )
    lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/r)*Math.cos(lat1), 
    Math.cos(d/r)-Math.sin(lat1)*Math.sin(lat2))

    lat2 = lat2/Math::PI * 180  
    lon2 = lon2/Math::PI * 180
    ori =getGridCoord(lat,lon)
    des = getGridCoord(lat2,lon2)

    ori[:radius] = ori[:y]-des[:y]+1 #include center point  
    return ori
    
    end 

    def getCoordsFromGrid(x,y)
        return  {:lat => getLat(y), :lng => getLong(x)}
    end 
    
end



#simulation = Simulation.new("simulation_data.txt", 50.00, -1.00, 100, Time.local(2012,3,5,8,0), 10)
    
#puts simulation.getYIndex(-0.99)

#puts simulation.getReading(49.99,-0.99,Time.local(2012,3,5,8,12))
    
#simulation.getTimeFrame(Time.local(2012,3,5,8,12))
      
