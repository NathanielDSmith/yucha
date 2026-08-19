describe('Income Manager', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Income').click()
  })

  it('should display income sources', () => {
    cy.contains('Monthly Income').should('be.visible')
    cy.contains('Add Income').should('be.visible')
  })

  it('should show validation error for missing name', () => {
    cy.get('select').first().select('job')
    cy.get('select').last().select('monthly')
    cy.get('input[type="number"]').type('5000')
    cy.get('button').contains('Add Income').click()

    cy.contains('Income source name is required').should('be.visible')
  })

  it('should show validation error for missing type', () => {
    cy.get('input[placeholder*="Software Engineer"]').type('Test Job')
    cy.get('select').last().select('monthly')
    cy.get('input[type="number"]').type('5000')
    cy.get('button').contains('Add Income').click()

    cy.contains('Job type is required').should('be.visible')
  })

  it('should show validation error for missing frequency', () => {
    cy.get('input[placeholder*="Software Engineer"]').type('Test Job')
    cy.get('select').first().select('job')
    cy.get('input[type="number"]').type('5000')
    cy.get('button').contains('Add Income').click()

    cy.contains('Frequency is required').should('be.visible')
  })

  it('should show validation error for invalid amount', () => {
    cy.get('input[placeholder*="Software Engineer"]').type('Test Job')
    cy.get('select').first().select('job')
    cy.get('select').last().select('monthly')
    cy.get('button').contains('Add Income').click()

    cy.contains('Amount must be greater than 0').should('be.visible')
  })
})
