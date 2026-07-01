import type { SportEvent } from "@bettin2win/types";
import { dataSourceLabel, isSampleEvent } from "./dataSourceLabel";

export function DataSourceBadge({ event }: { event: SportEvent }) {
  const sample = isSampleEvent(event);
  const label = sample ? "Sample data" : dataSourceLabel(event.source);

  return (
    <span className={`data-source-badge ${sample ? "sample" : "live"}`} title={event.source}>
      {sample ? "Practice board" : `Live · ${label}`}
    </span>
  );
}