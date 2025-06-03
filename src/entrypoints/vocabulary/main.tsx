import React from 'react';
import ReactDOM from 'react-dom/client';
import Vocabulary from './Vocabulary.tsx';
import '@/assets/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Vocabulary />
    </React.StrictMode>,
);
