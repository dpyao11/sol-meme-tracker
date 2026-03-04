import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';
import { Search, Copy, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';

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
      {/* Simple Header */}
      <header className="absolute top-0 left-0 right-0 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">SOL Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('holders')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'holders'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            持有者
          </button>
          <button
            onClick={() => setMode('buyers')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'buyers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            买家
          </button>
        </div>
      </header>

      {!results ? (
        // Input View - 完全居中
        <div className="min-h-screen flex items-center justify-center px-8">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                找出共同持有者
              </h1>
              <p className="text-xl text-gray-500">
                输入多个 Solana 代币地址，分析共同持有的钱包
              </p>
            </div>

            <div className="relative">
              <textarea
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder="输入代币地址，每行一个"
                className="w-full h-64 px-8 py-6 text-lg bg-white border border-gray-200 rounded-[32px] focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 resize-none transition-all shadow-sm hover:shadow-md"
                disabled={loading}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !addresses.trim()}
                className="absolute bottom-6 right-6 px-10 py-4 bg-blue-600 text-white rounded-[24px] font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    分析中 {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    开始分析
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-[24px]">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Results View
        <div className="min-h-screen pt-24 px-8 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <button
                onClick={() => setResults(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                返回
              </button>
              <div className="flex items-center gap-8 text-base">
                <div>
                  <span className="text-gray-500">代币数</span>
                  <span className="ml-3 font-bold text-gray-900 text-xl">{results.tokenCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">共同地址</span>
                  <span className="ml-3 font-bold text-gray-900 text-xl">{results.commonCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">重叠率</span>
                  <span className="ml-3 font-bold text-gray-900 text-xl">{results.percentage}%</span>
                </div>
              </div>
            </div>

            {results.commonAddresses.length > 0 ? (
              <div className="space-y-3">
                {results.commonAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50 border border-gray-200 rounded-[24px] transition-all"
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <span className="text-base text-gray-400 font-semibold w-10">
                        {idx + 1}
                      </span>
                      <code className="text-base text-gray-900 font-mono truncate">
                        {addr}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(addr)}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                        title="复制"
                      >
                        <Copy className="w-5 h-5 text-gray-600" />
                      </button>
                      <a
                        href={`https://solscan.io/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                        title="查看"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-600" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32">
                <p className="text-gray-400 text-2xl">没有找到共同地址</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
