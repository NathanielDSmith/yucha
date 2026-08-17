import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CurrencyProvider } from './lib/CurrencyContext.tsx'
import { NotificationProvider } from './lib/NotificationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </NotificationProvider>
  </StrictMode>,
)
