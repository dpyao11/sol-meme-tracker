import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';

function App() {
  const [mode, setMode] = useState('holders');
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    setProgress(0);

    try {
      const tokenAddresses = addresses
        .split('\n')
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0);

      if (tokenAddresses.length < 2) {
        throw new Error('请至少输入 2 个代币地址');
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
        percentage: ((common.length / (allData[0]?.length || 1)) * 100).toFixed(1),
      });
    } catch (err) {
      setError(err.message || '分析失败，请稍后重试');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      setError('复制失败，请手动复制地址');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight">SOL Tracker</h1>

          <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setMode('holders')}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                mode === 'holders'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              持有者
            </button>
            <button
              onClick={() => setMode('buyers')}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                mode === 'buyers'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              买家
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {!results ? (
          <section className="mx-auto max-w-3xl">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">输入代币地址并开始分析</h2>
              <p className="mt-2 text-sm text-slate-500">每行一个地址，至少输入两个</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <textarea
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder="请输入代币地址（每行一个）"
                className="h-72 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
                disabled={loading}
              />

              <button
                onClick={handleAnalyze}
                disabled={loading || !addresses.trim()}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? '分析中...' : '开始分析'}
              </button>

              {loading && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>进度</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">分析结果</h2>
              <button
                onClick={() => setResults(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                返回
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">代币数</div>
                <div className="mt-1 text-2xl font-semibold">{results.tokenCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">共同地址</div>
                <div className="mt-1 text-2xl font-semibold">{results.commonCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">重叠率</div>
                <div className="mt-1 text-2xl font-semibold">{results.percentage}%</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium">
                地址列表（{results.commonAddresses.length}）
              </div>

              {results.commonAddresses.length > 0 ? (
                <div className="max-h-[520px] overflow-auto">
                  {results.commonAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                    >
                      <div className="w-9 text-sm text-slate-400">{idx + 1}</div>
                      <div className="min-w-0 flex-1 truncate font-mono text-sm text-slate-800">{addr}</div>
                      <button
                        onClick={() => copyToClipboard(addr, idx)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        {copied === idx ? '已复制' : '复制'}
                      </button>
                      <a
                        href={`https://solscan.io/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        外链
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-slate-500">没有找到共同地址</div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
