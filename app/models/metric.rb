# frozen_string_literal: true

class Metric
  attr_reader :name

  def initialize(name:, project:)
    @name = name
    @project = project
  end

  def owners
    @project
      .owners
      .each { |owner| owner.count = get_count(@project.reports.last, [owner]) || 0 }
      .sort_by(&:count)
      .reverse
  end

  def chart_data(owners: nil)
    @project.daily_reports.filter_map do |report|
      count = get_count(report, owners)
      count && [report.commit_date.to_date, get_count(report, owners)]
    end
  end

  def contributions
    @project
      .contributions
      .order(commit_date: :desc)
      .select { |contribution| contribution.metrics[@name].present? }
      .take(60)
      .index_with { |contribution| contribution.metrics[@name] }
  end

  def contribution_by_author
    Contribution
      .total_by_author(@project.contributions)
      .transform_values { |metrics| metrics[@name] }
      .select { |_author, value| value.present? }
      .sort_by { |_author, value| value[:addition] + value[:deletion] }
  end

  def total
    @project.latest_report.metrics.dig(@name, 'total')
  end

  private

  # TODO: this should come from a method on Metric
  def get_count(report, owners)
    if owners
      owners.map { |owner| report.metrics.dig(name, 'owners', owner.handle) || 0 }.sum
    else
      report.metrics.dig(name, 'total')
    end
  end
end