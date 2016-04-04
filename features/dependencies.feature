Feature: docsmith - dependency checks
  As a user of docsmith
  I want to have the right dependencies installed
  So that I use docsmith

  Scenario: Without ruby
    Given An environment without ruby.
    When I run "docsmith install travis"
    Then I should see "Ruby is not available."

  Scenario: Without travis command
    Given An environment without the travis command.
    When I run "docsmith install travis"
    Then I should see "The travis command is not available."

  Scenario: Without pandoc
    Given An environment without pandoc.
    When I run "docsmith install metalsmith"
    Then I should see "Pandoc is not available."

 