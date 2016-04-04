Feature: docsmith - contents init
  As a user of docsmith
  I want to change the build component
  So that I use more customised workflows and advanced features

  Scenario: Starting with default project
    When I run "content init"
    Then I should have a ".travis.yml" file
    And I should have a "metalsmith.json" file with "metalsmith-layouts"
    And I should not have a "Gemfile" file
    And I should not have a "Rakefile" file

  Scenario: Starting from jekyll project
    When I run "content init jekyll"
    Then I should have a ".travis.yml" file
    And I should have a "Gemfile" file with "github-pages"
    And I should have a "Gemfile" file without "rake"
    And I should not have a "Rakefile" file

  Scenario: Starting from metalsmith project
    When I run "content init metalsmith"
    Then I should have a ".travis.yml" file
    And I should have a "metalsmith.json" file with "metalsmith-layouts"
    And I should not have a "Gemfile" file
    And I should not have a "Rakefile" file

  Scenario: .git folder is not overwritten
    Given I create a ".git/config" file with "[whazzup]"
    When I run "content init"
    Then I should have a ".git/config" file with "[whazzup]"

