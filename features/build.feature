Feature: docsmith install build
  As a user of docsmith
  I want to change the build component
  So that I use more customised workflows and advanced features

  Scenario: Starting from scratch
    Given I run docsmith "init"
    Then I should not have a ".travis.yml" file
    And I should not have a "Gemfile" with "rake"
    And I should not have a "Rakefile"

  Scenario: Starting from scratch and running docsmith install build
    Given I run docsmith "init"
    And I run docsmith "install build"
    Then I should see "No build plugin currently installed."

  Scenario: Starting from scratch and running docsmith install build travis
    Given I run docsmith "init"
    And I run docsmith "install build travis"
    Then I should have a ".travis.yml" file
    And I should have a "Gemfile" with "rake"

  Scenario: Starting with a github-pages build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install build"
    Then I should see "No build plugin currently installed."
    And I should not have a ".travis.yml" file
    And I should not have a "Gemfile" with "rake"
    And I should not have a "Rakefile"

  Scenario: Changing from a github-pages build to a travis build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install build travis"
    Then I should have a ".travis.yml" file
    And I should have a "Gemfile" with "rake"
    And I should have a "Rakefile"

  Scenario: Changing from a github-pages build to a travis build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install build travis"
    Then I should have a ".travis.yml" file
    And I should have a "Rakefile"
