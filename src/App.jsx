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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_85%_18%,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_55%_92%,rgba(99,102,241,0.2),transparent_44%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.22em] text-sky-300/80">SOL MEME TRACKER</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">共同地址分析仪表盘</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-700 bg-slate-900/80 p-1">
              <button
                onClick={() => setMode('holders')}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  mode === 'holders' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                持有者模式
              </button>
              <button
                onClick={() => setMode('buyers')}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  mode === 'buyers' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                买家模式
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/60 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">输入代币地址并发起分析</h2>
              <p className="mt-1 text-sm text-slate-400">每行一个地址，至少输入 2 个</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
              当前模式：{mode === 'holders' ? '共同持有者（Top 200）' : '共同早期买家（Top 100）'}
            </span>
          </div>

          <textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="请输入代币地址（每行一个）"
            className="h-56 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-sky-500 disabled:opacity-70"
            disabled={loading}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleAnalyze}
              disabled={loading || !addresses.trim()}
              className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
            >
              {loading ? '分析中...' : '开始分析'}
            </button>

            {results && (
              <button
                onClick={() => setResults(null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-500 sm:w-auto"
              >
                清空结果
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-sky-200">
                <span>Loading · 正在拉取并计算地址</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              Error · {error}
            </div>
          )}
        </section>

        {!results && !loading && !error && (
          <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-6 py-10 text-center">
            <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Empty State</p>
            <h3 className="mt-2 text-xl font-semibold">等待分析结果</h3>
            <p className="mt-2 text-sm text-slate-400">输入多个代币地址后点击“开始分析”，这里会展示统计和共同地址列表。</p>
          </section>
        )}

        {results && (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">代币数量</p>
                <p className="mt-2 text-3xl font-semibold text-sky-300">{results.tokenCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">共同地址</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{results.commonCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">重叠率</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-300">{results.percentage}%</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm">
                <span className="font-medium text-slate-200">地址列表（{results.commonAddresses.length}）</span>
                <span className="text-xs text-slate-400">支持复制与 Solscan 外链</span>
              </div>

              {results.commonAddresses.length > 0 ? (
                <div className="max-h-[520px] overflow-auto">
                  {results.commonAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 border-b border-slate-800/70 px-4 py-3 last:border-b-0"
                    >
                      <div className="w-10 text-sm text-slate-500">#{idx + 1}</div>
                      <div className="min-w-0 flex-1 truncate font-mono text-sm text-slate-200">{addr}</div>
                      <button
                        onClick={() => copyToClipboard(addr, idx)}
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 transition hover:border-slate-500"
                      >
                        {copied === idx ? '已复制' : '复制'}
                      </button>
                      <a
                        href={`https://solscan.io/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 transition hover:border-slate-500"
                      >
                        外链
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-sm text-slate-400">Empty · 没有找到共同地址</div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
