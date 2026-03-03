import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';

function App() {
  const [mode, setMode] = useState('holders');
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [sortBy, setSortBy] = useState('default');

  const exampleAddresses = {
    holders: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\nSo11111111111111111111111111111111111111112',
    buyers: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\nSo11111111111111111111111111111111111111112'
  };

  const fillExample = () => {
    setAddresses(exampleAddresses[mode]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportCSV = () => {
    if (!results || results.commonAddresses.length === 0) return;
    
    const csv = ['Address'].concat(results.commonAddresses).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sol-meme-tracker-${Date.now()}.csv`;
    a.click();
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    setProgress(0);
    setProgressText('开始分析...');

    try {
      const tokenAddresses = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (tokenAddresses.length < 2) {
        throw new Error('请至少输入2个代币地址');
      }

      const allData = [];
      const totalSteps = tokenAddresses.length + 1;

      for (let i = 0; i < tokenAddresses.length; i++) {
        const addr = tokenAddresses[i];
        setProgressText(`正在分析代币 ${i + 1}/${tokenAddresses.length}`);
        setProgress(((i + 1) / totalSteps) * 100);

        let data;
        if (mode === 'holders') {
          data = await getTopHolders(addr, 200);
        } else {
          data = await getEarlyBuyers(addr, 100);
        }

        allData.push(data);
      }

      setProgressText('查找共同地址...');
      setProgress(95);
      const common = findCommonAddresses(allData);

      setResults({
        tokenCount: tokenAddresses.length,
        commonCount: common.length,
        commonAddresses: common,
        allData: allData,
        percentage: ((common.length / (allData[0]?.length || 1)) * 100).toFixed(2)
      });

      setProgress(100);
      setProgressText('');
    } catch (err) {
      setError(err.message || '分析失败');
      setProgressText('');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a0e27]' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h1 className={`text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent`}>
              SOL Meme Tracker
            </h1>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            分析代币的共同持有者和早期买家 · 链上数据追踪
          </p>
        </div>

        {/* Main Card */}
        <div className={`${darkMode ? 'bg-[#151932]' : 'bg-white'} rounded-3xl shadow-2xl p-8 backdrop-blur-lg border ${darkMode ? 'border-purple-500/20' : 'border-gray-200'}`}>
          
          {/* Mode Toggle */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setMode('holders')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                mode === 'holders'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : darkMode 
                    ? 'bg-[#1a1f3a] text-gray-400 hover:bg-[#1f2442]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">👥</div>
              共同持有者 (前200)
            </button>
            <button
              onClick={() => setMode('buyers')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                mode === 'buyers'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                  : darkMode 
                    ? 'bg-[#1a1f3a] text-gray-400 hover:bg-[#1f2442]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">⚡</div>
              早期买家 (前100)
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                代币合约地址 (每行一个)
              </label>
              <button
                onClick={fillExample}
                className={`text-sm px-4 py-1 rounded-lg ${darkMode ? 'bg-[#1a1f3a] text-purple-400 hover:bg-[#1f2442]' : 'bg-gray-100 text-purple-600 hover:bg-gray-200'} transition-colors`}
              >
                填充示例
              </button>
            </div>
            <textarea
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
              placeholder="例如:&#10;JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&#10;So11111111111111111111111111111111111111112"
              className={`w-full h-40 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm transition-all ${
                darkMode 
                  ? 'bg-[#1a1f3a] border-2 border-purple-500/30 text-gray-300 placeholder-gray-600' 
                  : 'bg-gray-50 border-2 border-gray-300 text-gray-900'
              }`}
              disabled={loading}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !addresses.trim()}
            className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                分析中...
              </div>
            ) : (
              '🚀 开始分析'
            )}
          </button>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-6">
              <div className={`flex justify-between text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>{progressText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={`h-2 ${darkMode ? 'bg-[#1a1f3a]' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${darkMode ? 'bg-[#1a1f3a]' : 'bg-gradient-to-br from-purple-50 to-pink-50'} p-6 rounded-xl border ${darkMode ? 'border-purple-500/30' : 'border-purple-200'}`}>
                  <div className="text-3xl mb-2">📊</div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{results.tokenCount}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>分析代币数</div>
                </div>
                <div className={`${darkMode ? 'bg-[#1a1f3a]' : 'bg-gradient-to-br from-green-50 to-blue-50'} p-6 rounded-xl border ${darkMode ? 'border-green-500/30' : 'border-green-200'}`}>
                  <div className="text-3xl mb-2">🎯</div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{results.commonCount}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>共同地址数</div>
                </div>
                <div className={`${darkMode ? 'bg-[#1a1f3a]' : 'bg-gradient-to-br from-blue-50 to-purple-50'} p-6 rounded-xl border ${darkMode ? 'border-blue-500/30' : 'border-blue-200'}`}>
                  <div className="text-3xl mb-2">📈</div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{results.percentage}%</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>重叠率</div>
                </div>
              </div>

              {/* Address List */}
              {results.commonAddresses.length > 0 ? (
                <div className={`${darkMode ? 'bg-[#1a1f3a]' : 'bg-gray-50'} p-6 rounded-xl border ${darkMode ? 'border-purple-500/20' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      共同地址列表 ({results.commonAddresses.length})
                    </h3>
                    <button
                      onClick={exportCSV}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                      }`}
                    >
                      📥 导出 CSV
                    </button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.commonAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className={`${darkMode ? 'bg-[#0f1228] hover:bg-[#151932]' : 'bg-white hover:bg-gray-50'} p-4 rounded-lg border ${darkMode ? 'border-purple-500/20' : 'border-gray-200'} transition-all group`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center flex-shrink-0`}>
                              <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>#{idx + 1}</span>
                            </div>
                            <code className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                              {addr}
                            </code>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyToClipboard(addr)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                darkMode 
                                  ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400' 
                                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                              }`}
                            >
                              📋 复制
                            </button>
                            <a
                              href={`https://solscan.io/account/${addr}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                darkMode 
                                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                              }`}
                            >
                              🔗 查看
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'} p-6 rounded-xl border ${darkMode ? 'border-yellow-500/30' : 'border-yellow-200'}`}>
                  <p className={`${darkMode ? 'text-yellow-400' : 'text-yellow-800'} flex items-center gap-2`}>
                    <span>⚠️</span>
                    没有找到共同地址
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'} text-sm`}>
          <p>数据来源: Helius RPC · 仅供参考 · 不构成投资建议</p>
        </div>
      </div>
    </div>
  );
}

export default App;
