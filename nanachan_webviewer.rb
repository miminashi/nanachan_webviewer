#require "#{File.dirname(__FILE__)}/bundle/gems/environment"
#require 'rubygems'
require 'sinatra'
require 'erb'
require 'oauth'
require 'twitter'
require 'uri'
require 'yajl'
require 'mongo_mapper'
require 'json'
require 'pp'
require 'active_support'
require 'settings.rb'

$KCODE = 'UTF8'

# twitter settings
SITE = 'http://twitter.com/'
ACCESS_TOKEN_URL = 'http://twitter.com/oauth/access_token'
REQUEST_TOKEN_URL = 'http://twitter.com/oauth/request_token'
OAUTH_CALLBACK_URL  = 'http://viewer.nanachan.tv/twitter/oauth_callback'

# mongo settings
MongoMapper.connection = Mongo::Connection.new(MONGO_SERVER, 27017, :pool_size => MONGO_POOLSIZE, :timeout => MONGO_TIMEOUT)
MongoMapper.database = MONGO_DATABASE

class User
  include MongoMapper::EmbeddedDocument
  key :screen_name,       String
  key :name,              String
  key :profile_image_url, String
end

class Hashtag
  include MongoMapper::EmbeddedDocument
  key :hashtag, String
end

class Tweet
  include MongoMapper::Document
  key  :t_id,       Integer
  key  :text,       String
  key  :created_at, Data
  many :users
  many :hashtags
end


# sinatra settings
enable :sessions

helpers do
  def format_date(date)
    located = date.in_time_zone('Tokyo')
    #pp located.methods
    return "#{located.year}/#{located.month}/#{located.day} #{located.hour}:#{"%02d" % located.min}"
  end
end

get '/' do
  #pp session[:access_token_token].methods
  #p session[:access_token_secret]
  erb :index
end

get '/testview' do
  erb :testview, :layout => false
end

get '/twitter/status' do
  last_status = params[:last_status]
  p last_status
  if last_status
    tweets = Tweet.all('hashtags.hashtag' => HASHTAG, :t_id.gt => last_status.to_i, :limit => PER_PAGE, :order => 't_id desc')
  else
    tweets = Tweet.all('hashtags.hashtag' => HASHTAG, :limit => PER_PAGE, :order => 't_id desc')
  end
  results = []
  tweets.each do |t|
    result = {}
    result[:tweet_id] = t.t_id.to_s
    result[:formated_date] = format_date(t.created_at)
    result[:user_screen_name] = t.users[0].screen_name
    result[:user_profile_image_url] = t.users[0].profile_image_url
    result[:text] = t.text.gsub(/http\:\/\/v.7ch.tv\/\ \#7ch$/, '')
    #pp result
    results << result
  end
  pp results
  content_type 'application/json', :charset => 'utf-8'
  return results.to_json
end

get '/admin' do
  return 'wait forever'
end

post '/admin/update' do
  redirect_to '/admin'
end

get '/twitter/oauth' do
  consumer = OAuth::Consumer.new(
    CONSUMER_KEY,
    CONSUMER_SECRET,
    {:site => SITE}
  )
  request_token = consumer.get_request_token(:oauth_callback => OAUTH_CALLBACK_URL)
  session[:request_token] = request_token
  p session[:request_token]
  redirect request_token.authorize_url
end

get '/twitter/oauth_callback' do
  request_token = session[:request_token]
  puts '/twitter/oauth_callback'
  p request_token
  if request_token
    begin
      access_token = request_token.get_access_token(
        :oauth_token => params['oauth_token'],
        :oauth_verifier => params['oauth_verifier']
      )
      session[:screen_name] = access_token.params[:screen_name]
      session[:access_token_token] = access_token.token
      session[:access_token_secret] = access_token.secret
      session[:login] = true
      redirect '/'
    rescue Errno::ECONNRESET
      puts 'Errno::ECONNRESET'
      redirect '/twitter/oauth'
    rescue OAuth::Unauthorized
      puts 'OAuth::Unauthorized'
      redirect '/twitter/oauth'
    end
  else
    redirect '/twitter/oauth'
  end
end

get '/twitter/oauth_logout' do
  session[:screen_name] = nil
  session[:request_token] = nil
  session[:access_token_token] = nil
  session[:access_token_secret] = nil
  session[:login] = false
  redirect '/'
end

post '/twitter/update' do
  text = params['text']
  p text
  if session[:login]
    begin
      if text == ''
        status 400  # Bad Request
        return 'empty text'
      else
        Twitter.configure do |config|
          config.consumer_key = CONSUMER_KEY
          config.consumer_secret = CONSUMER_SECRET
          config.oauth_token = session[:access_token_token]
          config.oauth_token_secret = session[:access_token_secret]
        end
        t_text = text + ' ' + VIEWER_URL + ' #' + HASHTAG
        if t_text.split(//u).size > 150
          status 422  # Unprocessable Entity
          return 'text too long'
        else
          Twitter.update(t_text)
          status 200
          return 'post succeeded'
        end
      end
    rescue => e
      p e
      status 500  # Internal Server Error
      return 'something else bad'
    end
  else
    status 401  # Unauthorized
    return 'not logged in'
  end
end

post '/twitter/retweet' do
  p params
  if session[:login]
    id = params['id']
    if id
      Twitter.configure do |config|
        config.consumer_key = CONSUMER_KEY
        config.consumer_secret = CONSUMER_SECRET
        config.oauth_token = session[:access_token_token]
        config.oauth_token_secret = session[:access_token_secret]
      end
      Twitter.retweet(id)
      return 'RT was success'
    else
      status 400  # bad request
      return 'no tweet id'
    end
  else
    status 401  # Unauthorized
    return 'not logged in'
  end
end

