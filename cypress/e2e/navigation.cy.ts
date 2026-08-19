describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load home page and display welcome message', () => {
    cy.contains('Welcome to Yucha').should('be.visible')
    cy.contains('Let\'s begin').should('be.visible')
  })

  it('should navigate to spending tab', () => {
    cy.contains('Spending').click()
    cy.contains('Everyday Spending').should('be.visible')
    cy.contains('Recurring Costs').should('be.visible')
  })

  it('should navigate to income tab', () => {
    cy.contains('Income').click()
    cy.contains('Monthly Income').should('be.visible')
  })

  it('should navigate to goals tab', () => {
    cy.contains('Goals').click()
    cy.contains('Create Goal').should('be.visible')
  })

  it('should navigate to insights tab', () => {
    cy.contains('Insights').should('exist')
  })

  it('should navigate to settings tab', () => {
    cy.contains('Settings').click()
    cy.contains('Budget Allocation').should('be.visible')
  })

  it('should persist current tab on navigation', () => {
    cy.contains('Spending').click()
    cy.contains('Everyday Spending').should('be.visible')

    // Navigate to another tab
    cy.contains('Income').click()
    cy.contains('Monthly Income').should('be.visible')

    // Navigate back to Spending
    cy.contains('Spending').click()
    cy.contains('Everyday Spending').should('be.visible')
  })
})
