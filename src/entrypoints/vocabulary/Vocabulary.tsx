import { useState, useEffect } from 'react';

// 单词接口
interface Word {
  word: string;
  contexts: string[];
  createdAt: string;
}

// 生词本接口
interface VocabularyData {
  [key: string]: Word;
}

function Vocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyData>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // 加载生词本
  useEffect(() => {
    const loadVocabulary = async () => {
      setLoading(true);
      try {
        const result = await browser.storage.local.get('vocabulary');
        setVocabulary(result.vocabulary || {});
      } catch (error) {
        console.error('加载生词本失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVocabulary();
  }, []);

  // 删除单词
  const deleteWord = async (word: string) => {
    if (confirm(`确定要删除单词 "${word}" 吗？`)) {
      const newVocabulary = { ...vocabulary };
      delete newVocabulary[word];
      
      try {
        await browser.storage.local.set({ vocabulary: newVocabulary });
        setVocabulary(newVocabulary);
        if (selectedWord?.word === word) {
          setSelectedWord(null);
        }
      } catch (error) {
        console.error('删除单词失败:', error);
      }
    }
  };

  // 过滤单词
  const filteredWords = Object.values(vocabulary).filter(word => 
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 按创建时间排序
  const sortedWords = [...filteredWords].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">习得语言 - 生词本</h1>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索单词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : sortedWords.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {searchTerm ? '没有找到匹配的单词' : '您的生词本是空的'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2">
                单词列表 ({sortedWords.length})
              </h2>
              <ul className="space-y-2">
                {sortedWords.map((word) => (
                  <li 
                    key={word.word}
                    className={`p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-between items-center ${
                      selectedWord?.word === word.word ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => setSelectedWord(word)}
                  >
                    <span>{word.word}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWord(word.word);
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto">
              {selectedWord ? (
                <div>
                  <h2 className="text-2xl font-bold mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2">
                    {selectedWord.word}
                  </h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">上下文</h3>
                    <ul className="space-y-4">
                      {selectedWord.contexts.map((context, index) => (
                        <li key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                          {context}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    添加时间: {new Date(selectedWord.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  从左侧选择一个单词查看详情
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Vocabulary; 