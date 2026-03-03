import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';

function App() {
  const [mode, setMode] = useState('holders'); // 'holders' or 'buyers'
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    setProgress('开始分析...');

    try {
      const tokenAddresses = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (tokenAddresses.length < 2) {
        throw new Error('请至少输入2个代币地址');
      }

      const allData = [];

      for (let i = 0; i < tokenAddresses.length; i++) {
        const addr = tokenAddresses[i];
        setProgress(`正在分析代币 ${i + 1}/${tokenAddresses.length}: ${addr.slice(0, 8)}...`);

        let data;
        if (mode === 'holders') {
          data = await getTopHolders(addr, 200);
        } else {
          data = await getEarlyBuyers(addr, 100);
        }

        allData.push(data);
      }

      setProgress('查找共同地址...');
      const common = findCommonAddresses(allData);

      setResults({
        tokenCount: tokenAddresses.length,
        commonCount: common.length,
        commonAddresses: common,
        allData: allData
      });

      setProgress('');
    } catch (err) {
      setError(err.message || '分析失败');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SOL Meme 追踪器
          </h1>
          <p className="text-center text-gray-600 mb-8">分析代币的共同持有者和早期买家</p>

          {/* 模式选择 */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('holders')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                mode === 'holders'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              共同持有者 (前200)
            </button>
            <button
              onClick={() => setMode('buyers')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                mode === 'buyers'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              早期买家 (前100)
            </button>
          </div>

          {/* 输入区域 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              代币合约地址 (每行一个)
            </label>
            <textarea
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
              placeholder="例如:&#10;7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr&#10;EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
              disabled={loading}
            />
          </div>

          {/* 分析按钮 */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !addresses.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '分析中...' : '开始分析'}
          </button>

          {/* 进度提示 */}
          {progress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-center">{progress}</p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 结果展示 */}
          {results && (
            <div className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  找到 {results.commonCount} 个共同地址
                </h2>
                <p className="text-gray-600">
                  分析了 {results.tokenCount} 个代币
                </p>
              </div>

              {results.commonAddresses.length > 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">共同地址列表:</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.commonAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded border border-gray-200 font-mono text-sm hover:bg-purple-50 transition-colors"
                      >
                        <a
                          href={`https://solscan.io/account/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          {addr}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">没有找到共同地址</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 页脚 */}
        <div className="text-center mt-8 text-white text-sm opacity-75">
          <p>数据来源: Helius RPC · 仅供参考</p>
        </div>
      </div>
    </div>
  );
}

export default App;
