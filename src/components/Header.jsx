import { Download } from 'lucide-react';
import { Button } from './ui/button';

export function Header({ mode, results, onExport }) {
  return (
    <div className="bg-card border-b px-6 py-2 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">
        {mode === 'holders' ? '共同持有者分析' : '早期买家分析'}
      </h2>
      {results && (
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="w-4 h-4" />
          导出
        </Button>
      )}
    </div>
  );
}
