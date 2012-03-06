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
	
  def initialize(filename, lat_top_left, long_top_left, grid_size_in_meters, start_time, time_interval_in_minutes)
          
    f = File.open(filename)
		
    @x_size = Integer(f.readline())
    @y_size = Integer(f.readline())
    @t_size = Integer(f.readline())
		
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
    
    def getLong(x_index)
        @long_top_left + 
        x_index*@grid_size_in_meters/1.1119e+05/Math.cos(@lat_top_left/180*Math::PI)
    end
    
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
	
end

#simulation = Simulation.new("simulation_data.txt", 50.00, -1.00, 100, Time.local(2012,3,5,8,0), 10)
	
#puts simulation.getYIndex(-0.99)

#puts simulation.getReading(49.99,-0.99,Time.local(2012,3,5,8,12))
	
#simulation.getTimeFrame(Time.local(2012,3,5,8,12))
      
