Feature: docsmith install build
  As a user of docsmith
  I want to change the build component
  So that I use more customised workflows and advanced features

  Scenario: Starting from scratch
    When I run docsmith "init"
    Then I should not have a ".travis.yml" file
    And I should have a "Gemfile" file without "rake"
    And I should not have a "Rakefile" file

  Scenario: Starting from scratch and running docsmith install integration
    When I run docsmith "init"
    And I run docsmith "install integration"
    Then I should see "No integration plugin currently installed."

  # Scenario: Starting from scratch and running docsmith install integration travis
  #   When I run docsmith "init"
  #   And I run docsmith "install integration travis"
  #   Then I should have a ".travis.yml" file
  #   And I should have a "Gemfile" file with "rake"

  # Should fail with 'Can't figure out GitHub repo name'

  Scenario: Starting with a github-pages build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install integration"
    Then I should see "No integration plugin currently installed."
    And I should not have a ".travis.yml" file
    And I should have a "Gemfile" file without "rake"
    And I should not have a "Rakefile" file

  Scenario: Changing from a github-pages build to a travis build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install integration travis"
    Then I should have a ".travis.yml" file
    And I should have a "Gemfile" file with "rake"
    And I should have a "Rakefile" file

  Scenario: Changing from a github-pages build to a travis build
    Given I clone the contentascode "fixture/build-github-pages" branch
    When I run docsmith "install integration travis"
    Then I should have a ".travis.yml" file
    And I should have a "Rakefile" file
