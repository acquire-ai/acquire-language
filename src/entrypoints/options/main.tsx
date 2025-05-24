import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.tsx';
import '@/assets/style.css';
import '@/assets/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>,
);
