import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';

function App() {
  const [count, setCount] = useState(0);

  // 打开选项页面
  const openOptionsPage = () => {
    browser.runtime.openOptionsPage();
  };

  // 打开生词本页面
  const openVocabularyPage = () => {
    browser.tabs.create({ url: '/vocabulary.html' });
  };

  // 打开 YouTube
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
      <h1 className="text-2xl font-bold text-center mb-6">习得语言 (Acquire Language)</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-center mb-4">通过观看视频学习语言</p>
        
        <button 
          onClick={openYouTube}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors mb-4"
        >
          打开 YouTube
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={openVocabularyPage}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            生词本
          </button>
          
          <button 
            onClick={openOptionsPage}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            设置
          </button>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        习得语言 - 让语言学习更自然
      </div>
    </div>
  );
}

export default App;
