import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Rocket } from 'lucide-react';

export function InputCard({ addresses, setAddresses, loading, onAnalyze, onFillExample }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">代币合约地址</CardTitle>
          <Button onClick={onFillExample} variant="ghost" size="sm">
            填充示例
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          placeholder="每行输入一个代币合约地址&#10;例如:&#10;JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN&#10;So11111111111111111111111111111111111111112"
          className="w-full h-40 p-4 rounded-lg bg-secondary border border-input focus:border-ring focus:outline-none text-foreground placeholder-muted-foreground font-mono text-sm resize-none transition-colors"
          disabled={loading}
        />
        <Button
          onClick={onAnalyze}
          disabled={loading || !addresses.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              分析中...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              开始分析
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
