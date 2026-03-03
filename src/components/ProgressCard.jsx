import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

export function ProgressCard({ progress, progressText }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between text-sm mb-3 text-muted-foreground">
          <span>{progressText}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </CardContent>
    </Card>
  );
}
