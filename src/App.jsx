import { useState, useEffect } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';

function App() {
  const [mode, setMode] = useState('holders');
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        throw new Error('ERROR: MINIMUM 2 ADDRESSES REQUIRED');
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
      setError(err.message || 'SYSTEM ERROR');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1000);
  };

  const formatTime = (date) => {
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#00FF41] font-mono p-4 relative overflow-hidden">
      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF41] to-transparent animate-scan"></div>
      </div>

      {/* CRT glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.1)_0%,transparent_70%)]"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="border border-[#1A1A1A] p-4 mb-4 bg-black/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold tracking-wider">[SOL_TRACKER]</div>
              <div className="text-xs text-[#666666]">{formatTime(time)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('holders')}
                className={`px-4 py-1 border transition-all ${
                  mode === 'holders'
                    ? 'border-[#00FF41] bg-[#00FF41]/10 text-[#00FF41]'
                    : 'border-[#1A1A1A] text-[#666666] hover:border-[#00FF41] hover:text-[#00FF41]'
                }`}
              >
                [HOLDERS]
              </button>
              <button
                onClick={() => setMode('buyers')}
                className={`px-4 py-1 border transition-all ${
                  mode === 'buyers'
                    ? 'border-[#00FF41] bg-[#00FF41]/10 text-[#00FF41]'
                    : 'border-[#1A1A1A] text-[#666666] hover:border-[#00FF41] hover:text-[#00FF41]'
                }`}
              >
                [BUYERS]
              </button>
            </div>
          </div>
        </div>

        {!results ? (
          // Input View
          <div className="border border-[#1A1A1A] p-8 bg-black/50">
            <div className="mb-6">
              <div className="text-sm text-[#666666] mb-2">&gt; INPUT_ADDRESSES</div>
              <div className="relative">
                <textarea
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  placeholder="PASTE_TOKEN_ADDRESSES_HERE&#10;ONE_PER_LINE"
                  className="w-full h-64 bg-black border border-[#1A1A1A] p-4 text-[#00FF41] focus:border-[#00FF41] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,65,0.3)] resize-none placeholder-[#333333] transition-all"
                  disabled={loading}
                />
                {!loading && addresses && (
                  <div className="absolute bottom-4 right-4 w-2 h-4 bg-[#00FF41] animate-pulse"></div>
                )}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !addresses.trim()}
              className="w-full py-3 border border-[#00FF41] bg-[#00FF41]/10 text-[#00FF41] hover:bg-[#00FF41]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold tracking-wider"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span>[ANALYZING]</span>
                  <span className="inline-block w-32 h-2 border border-[#00FF41] relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-[#00FF41]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
              ) : (
                '[ANALYZE >>]'
              )}
            </button>

            {error && (
              <div className="mt-4 border-2 border-[#FF0055] p-4 bg-[#FF0055]/10">
                <div className="text-[#FF0055] font-bold">&gt;&gt; {error}</div>
              </div>
            )}
          </div>
        ) : (
          // Results View
          <div className="border border-[#1A1A1A] p-8 bg-black/50">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1A1A1A]">
              <button
                onClick={() => setResults(null)}
                className="text-[#00FF41] hover:text-[#FF0055] transition-colors"
              >
                [&lt;&lt; BACK]
              </button>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-[#666666]">TOKENS:</span>
                  <span className="ml-2 text-[#00FF41]">{results.tokenCount}</span>
                </div>
                <div>
                  <span className="text-[#666666]">COMMON:</span>
                  <span className="ml-2 text-[#00FF41]">{results.commonCount}</span>
                </div>
                <div>
                  <span className="text-[#666666]">OVERLAP:</span>
                  <span className="ml-2 text-[#00FF41]">{results.percentage}%</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-[#666666] mb-2">&gt; RESULTS:</div>

            {results.commonAddresses.length > 0 ? (
              <div className="space-y-1">
                {results.commonAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-3 border border-[#1A1A1A] hover:border-[#00FF41] hover:bg-[#00FF41]/5 transition-all cursor-pointer"
                    onClick={() => copyToClipboard(addr, idx)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-[#666666] w-12">
                        {String(idx + 1).padStart(3, '0')}
                      </span>
                      <span className="text-[#00FF41] truncate">
                        {addr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {copied === idx && (
                        <span className="text-[#FF0055] animate-pulse">[COPIED]</span>
                      )}
                      <a
                        href={`https://solscan.io/account/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#666666] hover:text-[#00FF41] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        [VIEW]
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-[#FF0055] p-8 text-center">
                <div className="text-[#FF0055] text-xl">[NO_COMMON_ADDRESSES_FOUND]</div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 border border-[#1A1A1A] p-2 bg-black/50 flex items-center justify-between text-xs text-[#666666]">
          <div>SYSTEM_OK</div>
          <div>POWERED_BY_HELIUS</div>
          <div>LATENCY: 23ms</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
