import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Copy, ExternalLink } from 'lucide-react';

export function ResultsList({ results, onCopy }) {
  if (results.commonAddresses.length === 0) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/10">
        <CardContent className="py-8 text-center">
          <p className="text-yellow-400">⚠️ 没有找到共同地址</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          共同地址 · {results.commonAddresses.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left py-2 px-4 font-medium">#</th>
                <th className="text-left py-2 px-4 font-medium">地址</th>
                <th className="text-right py-2 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.commonAddresses.map((addr, idx) => (
                <tr key={idx} className="hover:bg-accent/50 transition-colors group">
                  <td className="py-2 px-4 text-sm text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-4">
                    <code className="font-mono text-sm text-foreground">
                      {addr}
                    </code>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => onCopy(addr)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <a
                          href={`https://solscan.io/account/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
