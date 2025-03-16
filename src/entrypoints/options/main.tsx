import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.tsx';
import '@/entrypoints/popup/style.css'; // 复用 popup 的样式

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
); 