# frozen_string_literal: true

class Report < ApplicationRecord
  belongs_to :metric
  has_many :occurrences, dependent: :destroy

  validates :date, presence: true
  validates :value, presence: true
end