Feature: Voice and speed settings

  Background:
    Given I am on the practice page

  Scenario: Settings persist across page reloads
    When I open the settings disclosure
    And I change the speed slider to "1.1"
    And I reload the page
    And I open the settings disclosure
    Then the speed slider value should be "1.1"

  Scenario: Reset to defaults restores original values
    When I open the settings disclosure
    And I change the speed slider to "1.1"
    And I click reset to defaults
    Then the speed slider value should be "0.85"

  Scenario: Settings disclosure is collapsed when session starts
    When I click Begin
    Then the settings disclosure should be collapsed
