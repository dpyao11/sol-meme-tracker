import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Users, TrendingUp, Download, Copy, ExternalLink, Sparkles, BarChart3, Target } from 'lucide-react';

function App() {
  const [mode, setMode] = useState('holders');
  const [addresses, setAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const exampleAddresses = {
    holders: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\nSo11111111111111111111111111111111111111112',
    buyers: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\nSo11111111111111111111111111111111111111112'
  };

  const fillExample = () => setAddresses(exampleAddresses[mode]);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SOL Meme Tracker</h1>
                <p className="text-xs text-gray-500">链上数据分析工具</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setMode('holders')}
                variant={mode === 'holders' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                持有者
              </Button>
              <Button
                onClick={() => setMode('buyers')}
                variant={mode === 'buyers' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                买家
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        {!results && !loading && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              发现代币的
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> 共同持有者</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              输入多个 Solana 代币地址，快速找出同时持有这些代币的钱包地址
            </p>
          </div>
        )}

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  代币合约地址
                </label>
                <Button onClick={fillExample} variant="ghost" size="sm" className="text-purple-600">
                  填充示例
                </Button>
              </div>
              <textarea
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder="每行输入一个代币合约地址&#10;例如:&#10;JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&#10;So11111111111111111111111111111111111111112"
                className="w-full h-40 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 font-mono text-sm resize-none transition-all"
                disabled={loading}
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading || !addresses.trim()}
                className="w-full mt-6 h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        {loading && (
          <div className="max-w-3xl mx-auto mb-12">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex justify-between text-sm mb-3 text-gray-600">
                  <span>{progressText}</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-12">
            <Card className="border-red-200 bg-red-50 shadow-lg">
              <CardContent className="p-6">
                <p className="text-red-600 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{results.tokenCount}</div>
                      <div className="text-sm text-gray-500">分析代币数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{results.commonCount}</div>
                      <div className="text-sm text-gray-500">共同地址数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{results.percentage}%</div>
                      <div className="text-sm text-gray-500">重叠率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Address List */}
            {results.commonAddresses.length > 0 ? (
              <Card className="shadow-xl border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      共同地址列表 · {results.commonAddresses.length}
                    </h3>
                    <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      导出 CSV
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {results.commonAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="group p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                            </div>
                            <code className="font-mono text-sm text-gray-700 truncate flex-1">
                              {addr}
                            </code>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => copyToClipboard(addr)}
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <a
                                href={`https://solscan.io/account/${addr}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-yellow-700 text-lg">⚠️ 没有找到共同地址</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          <p>数据来源: Helius RPC · 仅供参考 · 不构成投资建议</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
