import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Copy, ExternalLink, List } from 'lucide-react';

export function ResultsList({ results, onCopy }) {
  if (results.commonAddresses.length === 0) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/10">
        <CardContent className="pt-6">
          <p className="text-yellow-400 flex items-center gap-2">
            <span>⚠️</span>
            没有找到共同地址
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          共同地址列表 ({results.commonAddresses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {results.commonAddresses.map((addr, idx) => (
            <div
              key={idx}
              className="bg-secondary hover:bg-accent rounded-lg p-4 transition-all group border"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                  </div>
                  <code className="font-mono text-sm text-foreground truncate">
                    {addr}
                  </code>
                </div>
                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => onCopy(addr)}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
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
  );
}
