require 'nanachan_webviewer.rb'
require 'rack/test'

class NanachanWebviewerTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  def post_twitter_update_success
    post '/twitter/update', {}
    assert_equal 'Hello World!', last_response.body
  end
end
