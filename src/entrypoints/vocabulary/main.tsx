import React from 'react';
import ReactDOM from 'react-dom/client';
import Vocabulary from './Vocabulary.tsx';
import '@/entrypoints/popup/style.css'; // Reuse popup styles

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Vocabulary />
    </React.StrictMode>,
);
