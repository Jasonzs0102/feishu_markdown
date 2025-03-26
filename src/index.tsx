import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
})

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('找不到root元素，请检查HTML结构')
}