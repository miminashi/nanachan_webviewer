#config.ru
require 'rubygems'
require 'bundler'
Bundler.setup
require 'nanachan_webviewer'
run Sinatra::Application

