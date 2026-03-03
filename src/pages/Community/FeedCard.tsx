import { ThumbsUp, Loader2 } from 'lucide-react';
import { copy } from '@/constants/copy';
import { MARKER_CONFIG, SUBTYPE_LABEL } from '@/constants/communityConfig';
import { useConfirmReport } from '@/hooks/useConfirmReport';
import type { CommunityReport } from '@/types/community';

interface FeedCardProps {
  report: CommunityReport;
  onSelect: () => void;
}

export function FeedCard({ report, onSelect }: FeedCardProps) {
  const { mutate: confirm, isPending } = useConfirmReport();

  const minutesAgo = Math.max(
    1,
    Math.floor((Date.now() - new Date(report.reported_at).getTime()) / 60000),
  );

  const cfg = MARKER_CONFIG[report.sub_type] ?? { emoji: '⚠️', bg: '#94a3b8' };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer active:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      <div
        className="size-9 rounded-full flex items-center justify-center text-base shrink-0"
        style={{ background: cfg.bg + '22' }}
      >
        {cfg.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{SUBTYPE_LABEL[report.sub_type] ?? report.sub_type}</p>
        <p className="text-xs text-muted-foreground truncate">
          {report.state} · {copy.community.reportedAgo(minutesAgo)}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); confirm(report.id); }}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 shrink-0"
      >
        {isPending
          ? <Loader2 className="size-3 animate-spin" />
          : <ThumbsUp className="size-3" />}
        {report.confirms > 0 ? copy.community.confirmsCount(report.confirms) : copy.community.confirmButton}
      </button>
    </div>
  );
}
