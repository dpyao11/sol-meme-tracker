import { useState } from 'react';
import { getTopHolders, getEarlyBuyers, findCommonAddresses } from './api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InputCard } from './components/InputCard';
import { ProgressCard } from './components/ProgressCard';
import { StatsGrid } from './components/StatsGrid';
import { ResultsList } from './components/ResultsList';
import { Card, CardContent } from './components/ui/card';

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
    <div className="min-h-screen flex">
      <Sidebar mode={mode} setMode={setMode} history={history} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header mode={mode} results={results} onExport={exportCSV} />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <InputCard
              addresses={addresses}
              setAddresses={setAddresses}
              loading={loading}
              onAnalyze={handleAnalyze}
              onFillExample={fillExample}
            />

            {loading && (
              <ProgressCard progress={progress} progressText={progressText} />
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/10">
                <CardContent className="pt-6">
                  <p className="text-red-400 flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {results && (
              <div className="space-y-6">
                <StatsGrid results={results} />
                <ResultsList results={results} onCopy={copyToClipboard} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
