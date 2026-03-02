import { CloudRain, TriangleAlert, ThumbsUp } from 'lucide-react';
import { copy } from '@/constants/copy';
import { useConfirmReport } from '@/hooks/useConfirmReport';
import type { CommunityReport } from '@/types/community';

const SUB_TYPE_LABELS: Record<string, string> = {
  renyai: copy.community.subTypeRenyai,
  sederhana: copy.community.subTypeSederhana,
  lebat: copy.community.subTypeLebat,
  banjir_kilat: copy.community.subTypeBanjirKilat,
  jalan_banjir: copy.community.subTypeJalanBanjir,
  pokok_tumbang: copy.community.subTypePokokTumbang,
  lain: copy.community.subTypeLain,
};

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

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer active:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      <div
        className={
          report.category === 'hujan'
            ? 'text-blue-500 shrink-0'
            : 'text-orange-500 shrink-0'
        }
      >
        {report.category === 'hujan' ? (
          <CloudRain className="size-5" />
        ) : (
          <TriangleAlert className="size-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{SUB_TYPE_LABELS[report.sub_type] ?? report.sub_type}</p>
        <p className="text-xs text-muted-foreground truncate">
          {report.state} · {copy.community.reportedAgo(minutesAgo)}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); confirm(report.id); }}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 shrink-0"
      >
        <ThumbsUp className="size-3" />
        {report.confirms > 0 ? copy.community.confirmsCount(report.confirms) : copy.community.confirmButton}
      </button>
    </div>
  );
}
