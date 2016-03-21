Feature: docsmith install build
  As a user of docsmith
  I want to change the build component
  So that I use more customised workflows and advanced features

  Scenario: Starting from scratch
    When I run "docsmith init"
    Then I should have a ".travis.yml" file
    And I should have a "Gemfile" file with "github-pages"
    And I should have a "Gemfile" file without "rake"
    And I should not have a "Rakefile" file

  Scenario: .git folder is not overwritten
    Given I create a ".git/config" file with "[whazzup]"
    When I run "docsmith init"
    Then I should have a ".git/config" file with "[whazzup]"

