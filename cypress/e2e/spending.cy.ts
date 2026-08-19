describe('Spending Log', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Spending').click()
  })

  it('should display spending entries', () => {
    cy.contains('Everyday Spending').should('be.visible')
    cy.contains('Recurring Costs').should('be.visible')
    cy.get('input[placeholder="Amount"]').should('be.visible')
  })

  it('should show validation error for empty amount', () => {
    cy.get('button').contains('Log spend').click()
    cy.contains('Amount must be greater than 0').should('be.visible')
  })

  it('should show validation error for empty category', () => {
    cy.get('input[placeholder="Amount"]').type('25')
    cy.get('button').contains('Log spend').click()
    cy.contains('Category is required').should('be.visible')
  })

  it('should successfully add a spending entry', () => {
    const timestamp = Date.now()
    const category = `Test-${timestamp}`

    cy.get('input[placeholder="Amount"]').type('35.50')
    cy.get('input[placeholder="Category"]').type(category)
    cy.get('button').contains('Log spend').click()

    // Verify success toast appears
    cy.contains('Spending logged successfully').should('be.visible')

    // Verify entry appears in list
    cy.contains(category).should('be.visible')
    cy.contains('$35.50').should('be.visible')

    // Verify form was cleared
    cy.get('input[placeholder="Amount"]').should('have.value', '')
  })

  it('should delete a spending entry', () => {
    // First add an entry
    cy.get('input[placeholder="Amount"]').type('10')
    cy.get('input[placeholder="Category"]').type('DeleteTest')
    cy.get('button').contains('Log spend').click()
    cy.contains('DeleteTest').should('be.visible')

    // Then delete it
    cy.contains('DeleteTest')
      .closest('li')
      .find('button[aria-label*="Delete"]')
      .click()

    cy.contains('Entry deleted').should('be.visible')
  })
})
