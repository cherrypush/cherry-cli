# frozen_string_literal: true

class Chart < ApplicationRecord
  belongs_to :dashboard
  has_many :chart_metrics, dependent: :destroy
  validates :name, presence: true
  enum kind: {
         line: 'line',
         area: 'area',
         stacked_area: 'stacked_area',
         stacked_percentage_area: 'stacked_percentage_area',
       }
end