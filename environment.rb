# Encoding.default_internal = 'UTF-8'
#$stderr.reopen $stdout
require "rubygems"
require "bundler"
Bundler.setup
Bundler.require
require 'rack/methodoverride'
require "net/http"
require "uri"
require "./lib/replay.rb" 
require File.dirname(__FILE__) + '/lib/simulation.rb'

class SocketIO
    
    def initialize(url, port)
        @Socket_url=url
        @Socket_port=port
        puts "#{@Socket_url}:#{@Socket_port}/broadcast socket.io init"
    end
        
    def broadcast (data)
        url = @Socket_url 
        
        req = Net::HTTP::Post.new("/broadcast", initheader = {'Content-Type' =>'application/json'})
        req.body = {:data => data}.to_json
        
        response = Net::HTTP.new(@Socket_url, @Socket_port).start {|http| http.request(req) }
        {:status=>"ok"}

    end 
end

class Controller < Sinatra::Base
  helpers do
    def admins_only
      unless session[:is_admin] == true
        profile = geoloqi.get 'account/profile'
        session[:is_admin] = true if settings.admin_usernames.include?(profile.username)
        redirect '/' unless session[:is_admin] == true
      end
    end

    def partial(page, options={})
      erb page, options.merge!(:layout => false)
		end

    def h(val)
      Rack::Utils.escape_html val
    end

    def require_login
      geoloqi.get_auth(params[:code], request.url) if params[:code] && !geoloqi.access_token?
      redirect geoloqi.authorize_url(request.url) unless geoloqi.access_token?
    end
    
    def socketIO
        @_socketIO ||= SocketIO.new SOCKET_URL,SORKET_PORT
    end
    
    def onclick_delete(msg='Are you sure?')
      return onclick_form(:delete) if msg.nil?
      %{ if (confirm('#{msg}')) {
          #{onclick_form(:delete)}
         };
         return false;
       }
    end

    def onclick_put(msg=nil)
      return onclick_form(:put) if msg.nil?
      %{ if (confirm('#{msg}')) {
          #{onclick_form(:put)}
         };
         return false;
       }
    end

    def onclick_form(meth)
      %{ var f = document.createElement('form');
         f.style.display = 'none';
         this.parentNode.appendChild(f);
         f.method = 'POST';
         f.action = this.href;
         var m = document.createElement('input');
         m.setAttribute('type', 'hidden');
         m.setAttribute('name', '_method');
         m.setAttribute('value', '#{meth.to_s.upcase}');
         f.appendChild(m);
         f.submit();
         return false;
        }
    end
    
  end


  configure :development do
    DataMapper::Logger.new STDOUT, :debug
  end

  configure do
    use Rack::MobileDetect
    
    if test?
      set :sessions, false
    else
      set :sessions, true
      set :session_secret,  'PUT SECRET HERE'
    end

    set :root, File.expand_path(File.join(File.dirname(__FILE__)))
    set :public, File.join(root, 'public')
    set :display_errors, true
    set :method_override, true
    set :admin_usernames, {}
    
    mime_type :woff, 'application/octet-stream'
    
    #setup including dir
    Dir.glob(File.join(root, 'models', '**/*.rb')).each { |f| require f }
    config_hash = YAML.load_file(File.join(root, 'config.yml'))[environment.to_s]
    raise "in config.yml, the \"#{environment.to_s}\" configuration is missing" if config_hash.nil?

    
    DataMapper.finalize
    DataMapper.setup :default, ENV['DATABASE_URL'] || config_hash['database']
    # DataMapper.auto_upgrade!
    DataMapper::Model.raise_on_save_failure = true
    GA_ID = config_hash['ga_id']
      
    SOCKET_URL = config_hash['socket_io_url']
    SORKET_PORT = config_hash['socket_io_port']
    DEFAULT_SIM_LAT = config_hash['default_sim_lat']
    DEFAULT_SIM_LNG = config_hash['default_sim_lng']
    SOCKET_CLIENT_REF = config_hash['socket_io_client_ref']
    PROXY_ADDRESS = config_hash['proxy_address']
    PROXY_PORT = config_hash['proxy_port'] 

    #sperating game instances
    $simulations=[]
    $simulation_utility=[]
    $mainloops=[]
    $game_area_top_left=[]
    
    #puts "self instance number (for experiment)"
    #ßputs self.object_id
    
  end

end

module Rack
  class Request
    def url_without_path
      url = scheme + "://"
      url << host

      if scheme == "https" && port != 443 ||
        scheme == "http" && port != 80
        url << ":#{port}"
      end
      url
    end
  end
end

class Array; def sum; inject( nil ) { |sum,x| sum ? sum+x : x }; end; end

require File.join(Controller.root, 'controllers/controller-api.rb')
require File.join(Controller.root, 'controllers/controller.rb')
require File.join(Controller.root, 'agent_utility.rb')
require File.join(Controller.root, 'controllers/controller-utility.rb')
require File.join(Controller.root, 'controllers/controller-test.rb')
require File.join(Controller.root, 'controllers/controller-visualization.rb')


