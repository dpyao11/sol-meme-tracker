import { History, TrendingUp, Users, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar({ mode, setMode, history, className }) {
  return (
    <div className={cn("w-16 bg-card border-r flex flex-col items-center py-4", className)}>
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-lg">🔍</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <button
          onClick={() => setMode('holders')}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            mode === 'holders'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          title="共同持有者"
        >
          <Users className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMode('buyers')}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            mode === 'buyers'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          title="早期买家"
        >
          <TrendingUp className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-auto">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          title="历史记录"
        >
          <History className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
