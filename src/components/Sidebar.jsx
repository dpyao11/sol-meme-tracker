import { History, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar({ mode, setMode, history, className }) {
  return (
    <div className={cn("w-64 bg-card border-r flex flex-col", className)}>
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔍</span>
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg">SOL Tracker</h1>
            <p className="text-muted-foreground text-xs">链上数据分析</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase mb-3 px-2">
            分析模式
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setMode('holders')}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                mode === 'holders'
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Users className="w-4 h-4" />
              共同持有者
            </button>
            <button
              onClick={() => setMode('buyers')}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                mode === 'buyers'
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              早期买家
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div>
            <h3 className="text-muted-foreground text-xs font-semibold uppercase mb-3 px-2 flex items-center gap-2">
              <History className="w-3 h-3" />
              历史记录
            </h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium">{item.commonCount}</span>
                    <span className="text-xs text-muted-foreground">个共同地址</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          <p>Powered by Helius</p>
        </div>
      </div>
    </div>
  );
}
