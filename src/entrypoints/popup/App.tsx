import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';

function App() {
    const [count, setCount] = useState(0);

    // Open options page
    const openOptionsPage = () => {
        browser.tabs.create({ url: '/options.html' });
    };

    // Open vocabulary page
    const openVocabularyPage = () => {
        browser.tabs.create({ url: '/vocabulary.html' });
    };

    // Open YouTube
    const openYouTube = () => {
        browser.tabs.create({ url: 'https://www.youtube.com' });
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
            <div className="flex justify-center space-x-4 mb-6">
                <a href="https://wxt.dev" target="_blank" className="hover:scale-110 transition-transform">
                    <img src={wxtLogo} className="h-16 w-16" alt="WXT logo" />
                </a>
                <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform">
                    <img src={reactLogo} className="h-16 w-16 animate-spin-slow" alt="React logo" />
                </a>
            </div>
            <h1 className="text-2xl font-bold text-center mb-6">Acquire Language</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <p className="text-center mb-4">Learn a language by watching videos</p>

                <button
                    onClick={openYouTube}
                    className="w-full bg-red-600 hover:bg-red-700 dark:text-white light:text-black font-medium py-2 px-4 rounded-md transition-colors mb-4"
                >
                    Open YouTube
                </button>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={openVocabularyPage}
                        className="bg-green-500 hover:bg-green-600 dark:text-white light:text-black font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Vocabulary
                    </button>

                    <button
                        onClick={openOptionsPage}
                        className="bg-blue-500 hover:bg-blue-600 dark:text-white light:text-black font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Settings
                    </button>
                </div>
            </div>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                Acquire Languages - Make language learning more natural
            </div>
        </div>
    );
}

export default App;
