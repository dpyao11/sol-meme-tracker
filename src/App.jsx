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
  const [history, setHistory] = useState([]);

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

      const result = {
        tokenCount: tokenAddresses.length,
        commonCount: common.length,
        commonAddresses: common,
        allData: allData,
        percentage: ((common.length / (allData[0]?.length || 1)) * 100).toFixed(2),
        timestamp: new Date().toLocaleString('zh-CN')
      };

      setResults(result);
      setHistory(prev => [result, ...prev].slice(0, 10));
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
    <div className="min-h-screen bg-[#0a0e27] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f1228] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">SOL Tracker</h1>
              <p className="text-gray-500 text-xs">链上数据分析</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3 px-2">分析模式</h3>
            <div className="space-y-1">
              <button
                onClick={() => setMode('holders')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === 'holders'
                    ? 'bg-purple-500/20 text-purple-300 font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">👥</span>
                共同持有者
              </button>
              <button
                onClick={() => setMode('buyers')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === 'buyers'
                    ? 'bg-purple-500/20 text-purple-300 font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">⚡</span>
                早期买家
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3 px-2">历史记录</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{item.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{item.commonCount}</span>
                      <span className="text-xs text-gray-500">个共同地址</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="text-xs text-gray-500 text-center">
            <p>Powered by Helius</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f1228] border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {mode === 'holders' ? '共同持有者分析' : '早期买家分析'}
              </h2>
              <p className="text-gray-400 text-sm">
                {mode === 'holders' ? '找出同时持有多个代币的钱包地址' : '找出多个代币的共同早期买家'}
              </p>
            </div>
            {results && (
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>📥</span>
                导出 CSV
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Input Card */}
            <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-300">
                  代币合约地址
                </label>
                <button
                  onClick={fillExample}
                  className="text-sm px-3 py-1 rounded-lg bg-white/5 text-purple-400 hover:bg-white/10 transition-colors"
                >
                  填充示例
                </button>
              </div>
              <textarea
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder="每行输入一个代币合约地址&#10;例如:&#10;JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&#10;So11111111111111111111111111111111111111112"
                className="w-full h-32 p-4 rounded-xl bg-[#1a1f3a] border border-white/10 focus:border-purple-500/50 focus:outline-none text-gray-300 placeholder-gray-600 font-mono text-sm resize-none transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !addresses.trim()}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    开始分析
                  </>
                )}
              </button>
            </div>

            {/* Progress */}
            {loading && (
              <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
                <div className="flex justify-between text-sm mb-3 text-gray-400">
                  <span>{progressText}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-[#1a1f3a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <p className="text-red-400 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-3xl font-bold text-white mb-1">{results.tokenCount}</div>
                    <div className="text-sm text-gray-400">分析代币数</div>
                  </div>
                  <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-3xl font-bold text-green-400 mb-1">{results.commonCount}</div>
                    <div className="text-sm text-gray-400">共同地址数</div>
                  </div>
                  <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
                    <div className="text-3xl mb-2">📈</div>
                    <div className="text-3xl font-bold text-blue-400 mb-1">{results.percentage}%</div>
                    <div className="text-sm text-gray-400">重叠率</div>
                  </div>
                </div>

                {/* Address List */}
                {results.commonAddresses.length > 0 ? (
                  <div className="bg-[#0f1228] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📋</span>
                      共同地址列表 ({results.commonAddresses.length})
                    </h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {results.commonAddresses.map((addr, idx) => (
                        <div
                          key={idx}
                          className="bg-[#1a1f3a] hover:bg-[#1f2442] rounded-xl p-4 transition-all group border border-white/5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-400">#{idx + 1}</span>
                              </div>
                              <code className="font-mono text-sm text-gray-300 truncate">
                                {addr}
                              </code>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => copyToClipboard(addr)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                              >
                                复制
                              </button>
                              <a
                                href={`https://solscan.io/account/${addr}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                              >
                                查看
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <p className="text-yellow-400 flex items-center gap-2">
                      <span>⚠️</span>
                      没有找到共同地址
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;