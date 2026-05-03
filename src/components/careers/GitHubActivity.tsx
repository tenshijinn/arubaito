import { useQuery } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const REPOS = [
  { name: "tenshijinn/arubaito", color: [237, 86, 90] as [number, number, number], label: "arubaito" },
  { name: "tenshijinn/askrei", color: [255, 20, 147] as [number, number, number], label: "askrei" },
  { name: "tenshijinn/zkprof", color: [0, 255, 65] as [number, number, number], label: "zkprof" },
];

const DAYS = 182; // ~6 months (26 weeks)
const CELL = 11;
const GAP = 2;

type DayCell = {
  date: string;
  counts: Record<string, number>;
  total: number;
};

async function fetchRepoCommits(repo: string, since: string): Promise<string[]> {
  const dates: string[] = [];
  // Use GitHub's commits API; paginate up to 5 pages of 100
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=100&page=${page}`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    for (const c of data) {
      const d = c?.commit?.author?.date || c?.commit?.committer?.date;
      if (d) dates.push(d.slice(0, 10));
    }
    if (data.length < 100) break;
  }
  return dates;
}

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
    queryKey: ["github-activity-3repos"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - DAYS);
      const sinceIso = since.toISOString();
      const results = await Promise.all(
        REPOS.map(async (r) => [r.name, await fetchRepoCommits(r.name, sinceIso)] as const)
      );
      const map: Record<string, string[]> = {};
      for (const [name, dates] of results) map[name] = dates;
      return buildGrid(map);
    },
    staleTime: 1000 * 60 * 30,
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
        <div className="flex gap-[2px] flex-1 items-center justify-center">
          <div className="flex gap-[2px]">
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[2px]">
                {col.map((cell) => (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="rounded-[2px]"
                        style={{ backgroundColor: colorFor(cell), width: 9, height: 9 }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-mono text-xs">
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
