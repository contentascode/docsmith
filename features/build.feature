Feature: docsmith - content build
  As a user of docsmith
  I want to build my website
  So that I can see my content in its various publishable forms

  Scenario: Starting from metalsmith default template and run content build
    When I run "content init"
    And I run "content build"
    And I should have a "_site" folder
    And I should see "successfully built"

  Scenario: Starting from jekyll template and run content build
    When I run "content init jekyll"
    And I run "content build"
    And I should have a "_site" folder
    And I should see "done"