import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { configurarSite } from './utils/siteConfig'

// Configura o título e o favicon no carregamento inicial
configurarSite()

// Renderiza o aplicativo React
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
