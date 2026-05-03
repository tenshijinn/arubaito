import { useQuery } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const REPOS = [
  { name: "tenshijinn/arubaito", color: [237, 86, 90] as [number, number, number], label: "arubaito" },
  { name: "tenshijinn/askrei", color: [255, 20, 147] as [number, number, number], label: "askrei" },
  { name: "tenshijinn/zkprof", color: [0, 255, 65] as [number, number, number], label: "zkprof" },
];

const DAYS = 182; // ~6 months (26 weeks)
const CELL = 10;
const GAP = 2;

type DayCell = {
  date: string;
  counts: Record<string, number>;
  total: number;
};

function buildGrid(allCommits: Record<string, string[]>): DayCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: DayCell[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const counts: Record<string, number> = {};
    let total = 0;
    for (const repo of REPOS) {
      const c = (allCommits[repo.name] || []).filter((x) => x === key).length;
      counts[repo.name] = c;
      total += c;
    }
    cells.push({ date: key, counts, total });
  }
  return cells;
}

function colorFor(cell: DayCell): string {
  if (cell.total === 0) return "#dbd9d7";
  // Find repo with most commits that day
  let dominant = REPOS[0];
  let max = -1;
  for (const r of REPOS) {
    if ((cell.counts[r.name] || 0) > max) {
      max = cell.counts[r.name] || 0;
      dominant = r;
    }
  }
  // Intensity by total
  const intensity = Math.min(1, 0.35 + cell.total * 0.18);
  const [r, g, b] = dominant.color;
  return `rgba(${r}, ${g}, ${b}, ${intensity})`;
}

export const GitHubActivity = () => {
  const { data: cells = [] } = useQuery({
    queryKey: ["github-activity-edge-6mo-v3"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-github-activity");
      if (error) {
        console.error("github-activity invoke error", error);
        return buildGrid({});
      }
      const map: Record<string, string[]> = (data?.data as Record<string, string[]>) || {};
      return buildGrid(map);
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  // Arrange into 7 rows x N cols
  const cols: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    cols.push(cells.slice(i, i + 7));
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className="w-full h-full flex flex-col justify-between" style={{ color: "#181818" }}>
        <div className="flex items-center gap-1 text-[8px] font-bold mb-1 tracking-wide" style={{ fontFamily: "Consolas, monospace" }}>
          <Github className="h-3 w-3" />
          <span>GitHub · 6mo</span>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="flex" style={{ gap: GAP }}>
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
                {col.map((cell) => (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="rounded-[2px]"
                        style={{ backgroundColor: colorFor(cell), width: CELL, height: CELL }}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="font-mono text-xs rounded-lg border-0"
                      style={{ backgroundColor: "#181818", color: "#faf1e1" }}
                    >
                      <div className="font-bold">{cell.date}</div>
                      <div>Total: {cell.total} commits</div>
                      {REPOS.map((r) => (
                        <div key={r.name} style={{ color: `rgb(${r.color.join(",")})` }}>
                          {r.label}: {cell.counts[r.name] || 0}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-1 text-[7px]" style={{ fontFamily: "Consolas, monospace" }}>
          {REPOS.map((r) => (
            <div key={r.name} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: `rgb(${r.color.join(",")})` }} />
              <span style={{ color: `rgb(${r.color.join(",")})` }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
