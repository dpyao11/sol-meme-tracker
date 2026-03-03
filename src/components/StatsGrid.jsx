import { Card, CardContent } from './ui/card';
import { BarChart3, Target, TrendingUp } from 'lucide-react';

export function StatsGrid({ results }) {
  const stats = [
    {
      icon: BarChart3,
      value: results.tokenCount,
      label: '分析代币数',
      color: 'text-blue-400'
    },
    {
      icon: Target,
      value: results.commonCount,
      label: '共同地址数',
      color: 'text-green-400'
    },
    {
      icon: TrendingUp,
      value: `${results.percentage}%`,
      label: '重叠率',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="pt-6">
            <stat.icon className={`w-8 h-8 mb-3 ${stat.color}`} />
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
