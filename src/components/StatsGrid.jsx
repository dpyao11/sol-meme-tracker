import { Card, CardContent } from './ui/card';
import { BarChart3, Target, TrendingUp } from 'lucide-react';

export function StatsGrid({ results }) {
  const stats = [
    {
      icon: BarChart3,
      value: results.tokenCount,
      label: '代币数',
    },
    {
      icon: Target,
      value: results.commonCount,
      label: '共同地址',
    },
    {
      icon: TrendingUp,
      value: `${results.percentage}%`,
      label: '重叠率',
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
