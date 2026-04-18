import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import BerryLogo from "@/components/berry/BerryLogo";
import BerryButton from "@/components/berry/BerryButton";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/features/auth/contexts/AuthContext";
import { useIsAdmin } from "@/features/safety/hooks/useSafety";
import { safetyService, type Report } from "@/features/safety/services/safetyService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<Report["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  reviewing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const AdminReportsPage = () => {
  const navigate = useNavigate();
  const { authUser, loading: authLoading } = useAuthContext();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(authUser?.id);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Report["status"] | "all">("pending");

  const loadReports = async () => {
    setLoading(true);
    const { reports, error } = await safetyService.listReports();
    if (error) toast.error("Failed to load reports", { description: error });
    setReports(reports);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadReports();
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BerryLogo size="lg" className="animate-pulse" />
      </div>
    );
  }

  if (!authUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-berry-3 text-center space-y-berry-2">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-[var(--text-lg)] font-bold text-foreground">Admins only</h1>
        <p className="text-[var(--text-sm)] text-muted-foreground max-w-[280px]">
          You don't have permission to view reports. Ask an admin to grant your account the admin role.
        </p>
        <BerryButton onClick={() => navigate("/")}>Go home</BerryButton>
      </div>
    );
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const setStatus = async (reportId: string, status: Report["status"]) => {
    const { ok, error } = await safetyService.updateReportStatus(reportId, status, authUser.id);
    if (!ok) {
      toast.error("Update failed", { description: error ?? undefined });
      return;
    }
    toast.success(`Marked as ${status}`);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/90 backdrop-blur-xl border-b border-border px-berry-2 py-berry-2 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-berry-1">
          <button
            onClick={() => navigate("/")}
            className="w-[36px] h-[36px] rounded-[var(--radius-full)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-[var(--text-lg)] font-bold berry-gradient-text">Reports</h1>
          <span className="ml-auto text-[var(--text-xs)] text-muted-foreground">{reports.length} total</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-berry-2 py-berry-3 space-y-berry-3">
        {/* Filters */}
        <div className="flex gap-berry-1 overflow-x-auto pb-1">
          {(["pending", "reviewing", "resolved", "dismissed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-berry-2 py-berry-1 rounded-[var(--radius-full)] text-[var(--text-xs)] font-semibold border transition-all whitespace-nowrap capitalize",
                filter === f
                  ? "berry-gradient text-primary-foreground border-transparent"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-berry-6">
            <BerryLogo size="lg" className="animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-berry-6 text-muted-foreground">
            <p className="text-[var(--text-sm)]">No reports in this view 🍓</p>
          </div>
        ) : (
          <div className="space-y-berry-2">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="bg-card border border-border rounded-[var(--radius-lg)] p-berry-2 space-y-berry-1"
              >
                <div className="flex items-start justify-between gap-berry-1">
                  <div className="space-y-[2px] min-w-0">
                    <p className="text-[var(--text-sm)] font-semibold text-foreground">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("capitalize text-[10px]", STATUS_COLORS[r.status])}>
                    {r.status}
                  </Badge>
                </div>

                {r.details && (
                  <p className="text-[var(--text-sm)] text-foreground/80 leading-relaxed bg-muted/40 rounded-[var(--radius-md)] p-berry-1">
                    {r.details}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-berry-1 text-[10px]">
                  <div>
                    <p className="text-muted-foreground">Reporter</p>
                    <p className="font-mono text-foreground/70 truncate" title={r.reporter_id}>{r.reporter_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reported</p>
                    <p className="font-mono text-foreground/70 truncate" title={r.reported_id}>{r.reported_id}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-berry-1 pt-berry-1 border-t border-border/50">
                  {r.status !== "reviewing" && (
                    <button
                      onClick={() => setStatus(r.id, "reviewing")}
                      className="px-berry-2 py-[6px] rounded-[var(--radius-full)] text-[10px] font-semibold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                    >
                      Mark reviewing
                    </button>
                  )}
                  {r.status !== "resolved" && (
                    <button
                      onClick={() => setStatus(r.id, "resolved")}
                      className="px-berry-2 py-[6px] rounded-[var(--radius-full)] text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    >
                      Resolve
                    </button>
                  )}
                  {r.status !== "dismissed" && (
                    <button
                      onClick={() => setStatus(r.id, "dismissed")}
                      className="px-berry-2 py-[6px] rounded-[var(--radius-full)] text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-muted/70"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminReportsPage;
