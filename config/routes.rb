# frozen_string_literal: true

Rails.application.routes.draw do
  mount Blazer::Engine, at: 'blazer' # authentication method set in blazer.yml

  get 'auth/:provider/callback', to: 'sessions#create'
  get '/sign_out', to: 'sessions#destroy', as: :signout
  get '/auth/github', as: :github_sign_in

  namespace :api do
    resources :reports, only: [] do # TODO: remove this controller
      get :last, on: :collection
    end
    resource :push, only: :create
  end

  # namespace dedicated to user authenticated routes
  namespace :user do
    resources :projects, only: %i[index update destroy]
    resource :settings, only: :show
    resource :favorites, only: %i[create destroy]
    resources :authorizations, only: %i[index new create destroy]
    resources :metrics, only: %i[index show destroy]
  end

  get :demo, to: 'pages#demo'
  get :docs, to: 'pages#docs'
  get :pricing, to: 'pages#pricing'
  get :privacy, to: 'pages#privacy'
  get :terms, to: 'pages#terms'

  root 'pages#home'
end