import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';
import { Search, Copy, ExternalLink, Loader2 } from 'lucide-react';

function App() {
  const [mode, setMode] = useState('holders');
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    setProgress(0);

    try {
      const tokenAddresses = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (tokenAddresses.length < 2) {
        throw new Error('请至少输入2个代币地址');
      }

      const allData = [];
      const totalSteps = tokenAddresses.length;

      for (let i = 0; i < tokenAddresses.length; i++) {
        setProgress(((i + 1) / totalSteps) * 100);

        let data;
        if (mode === 'holders') {
          data = await getTopHolders(tokenAddresses[i], 200);
        } else {
          data = await getEarlyBuyers(tokenAddresses[i], 100);
        }

        allData.push(data);
      }

      const common = findCommonAddresses(allData);

      setResults({
        tokenCount: tokenAddresses.length,
        commonCount: common.length,
        commonAddresses: common,
        percentage: ((common.length / (allData[0]?.length || 1)) * 100).toFixed(1)
      });
    } catch (err) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">SOL Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('holders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'holders'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              持有者
            </button>
            <button
              onClick={() => setMode('buyers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'buyers'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              买家
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-16">
        {!results ? (
          // Input View
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
            <div className="w-full max-w-3xl">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  找出共同持有者
                </h1>
                <p className="text-lg text-gray-500">
                  输入多个 Solana 代币地址，分析共同持有的钱包
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  placeholder="输入代币地址，每行一个"
                  className="w-full h-48 px-6 py-4 text-base bg-white border-2 border-gray-200 rounded-3xl focus:border-blue-500 focus:outline-none resize-none transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !addresses.trim()}
                  className="absolute bottom-4 right-4 px-8 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      分析中 {Math.round(progress)}%
                    </>
                  ) : (
                    '开始分析'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Results View
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setResults(null)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← 返回
              </button>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">代币数:</span>
                  <span className="ml-2 font-semibold text-gray-900">{results.tokenCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">共同地址:</span>
                  <span className="ml-2 font-semibold text-gray-900">{results.commonCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">重叠率:</span>
                  <span className="ml-2 font-semibold text-gray-900">{results.percentage}%</span>
                </div>
              </div>
            </div>

            {results.commonAddresses.length > 0 ? (
              <div className="space-y-2">
                {results.commonAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm text-gray-400 font-medium w-8">
                        {idx + 1}
                      </span>
                      <code className="text-sm text-gray-900 font-mono truncate">
                        {addr}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(addr)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="复制"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <a
                        href={`https://solscan.io/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="查看"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">没有找到共同地址</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
