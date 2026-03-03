import { Download } from 'lucide-react';
import { Button } from './ui/button';

export function Header({ mode, results, onExport }) {
  return (
    <div className="bg-card border-b px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === 'holders' ? '共同持有者分析' : '早期买家分析'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {mode === 'holders' 
              ? '找出同时持有多个代币的钱包地址' 
              : '找出多个代币的共同早期买家'}
          </p>
        </div>
        {results && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4" />
            导出 CSV
          </Button>
        )}
      </div>
    </div>
  );
}
