#require "#{File.dirname(__FILE__)}/bundle/gems/environment"
#require 'rubygems'
require 'sinatra'
require 'erb'
require 'oauth'
require 'twitter'
require 'uri'
require 'yajl'

SITE = 'http://twitter.com/'
ACCESS_TOKEN_URL = 'http://twitter.com/oauth/access_token'
REQUEST_TOKEN_URL = 'http://twitter.com/oauth/request_token'
OAUTH_CALLBACK_URL  = 'http://viewer.nanachan.tv/twitter/oauth_callback'
CONSUMER_KEY = 'avXUHaUfho6a4PPFflcxA'
CONSUMER_SECRET = 'dTifkIEue9TFjvAdRGP5r1wNZ9YP9ORtPFki4teAjk'
HASHTAG = '#7ch'

enable :sessions

get '/' do
  p session[:access_token_token]
  p session[:access_token_secret]
  if session[:access_token_token] and session[:access_token_secret]
    @tweet_post = '<input type="text" name="tweet_post_input" id="tweet-post-input"><input type="button" value="TWEET!" onclick="post()">'
  else
    @tweet_post = '<a href="/twitter/oauth">会話に参加する</a>'
  end
  erb :index
end

get '/twitter/oauth' do
  consumer = OAuth::Consumer.new(
    CONSUMER_KEY,
    CONSUMER_SECRET,
    {:site => SITE}
  )
  request_token = consumer.get_request_token(:oauth_callback => OAUTH_CALLBACK_URL)
  session[:request_token] = request_token
  redirect request_token.authorize_url
end

get '/twitter/oauth_callback' do
  # あやしいコード
  u = URI.parse(request.env['REQUEST_URI'])
  _params = {}
  u.query.split('&').each do |ele|
    ele = ele.split('=')
    _params[ele[0]] = ele[1]
  end
  # end of あやしいコード
  request_token = session[:request_token]
  access_token = request_token.get_access_token(
    :oauth_token => _params['oauth_token'],
    :oauth_verifier => _params['oauth_verifier']
  )
  session[:access_token_token] = access_token.token
  session[:access_token_secret] = access_token.secret
  redirect '/'
end

post '/twitter/update' do
  # あやしいコード
  _params = request.env['rack.request.form_hash']
  # end of あやしいコード
  text = _params['text']
  if session[:access_token_token] and session[:access_token_secret]
    begin
      if text == ''
        return 'FAILED'
      else
        oauth = Twitter::OAuth.new(CONSUMER_KEY, CONSUMER_SECRET)
        oauth.authorize_from_access(session[:access_token_token], session[:access_token_secret])
        client = Twitter::Base.new(oauth)
        client.update(text + ' http://viewer.nanachan.tv/ ' + HASHTAG)
        return 'OK'
      end
    rescue => e
      p e
      return 'FAILED'
    end
  else
    return 'NOLOGIN'
  end
end

