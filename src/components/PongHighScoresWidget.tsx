import React from 'react';
import { usePongHighScores } from '@/hooks/usePongHighScores';
import { Trophy, Medal, Award, Gamepad2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PongHighScoresWidget: React.FC = () => {
  const { highScores, loading } = usePongHighScores();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>
    );
  }

  if (!highScores.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No high scores yet</p>
        <p className="text-xs">Be the first to play!</p>
      </div>
    );
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">{position}</span>;
    }
  };

  return (
    <div className="space-y-2">
      {highScores.slice(0, 5).map((score, index) => (
        <div
          key={score.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-500/5 transition-colors"
        >
          <div className="flex-shrink-0">
            {getPositionIcon(index + 1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {score.player_name}
            </p>
          </div>
          <div className="text-sm font-bold text-pink-500">
            {score.score.toLocaleString()}
          </div>
        </div>
      ))}
      {highScores.length === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Play Pong to see your name here!
        </p>
      )}
    </div>
  );
};

export default PongHighScoresWidget;