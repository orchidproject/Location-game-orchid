class Controller < Sinatra::Base

    
    get '/agent_utility/distance_between' do
        location1=Geokit::LatLng.new params[:lat1], params[:lng1]
        location2=Geokit::LatLng.new params[:lat2], params[:lng2]
    
        
        distance=location1.distance_to location2, {:units=>:kms}
        {:distance=> distance}.to_json
    end
end

