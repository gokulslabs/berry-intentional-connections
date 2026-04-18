import { useState } from "react";
import { MoreVertical, UserX, Flag, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BerryButton from "@/components/berry/BerryButton";
import { REPORT_REASONS, type ReportReason } from "@/features/safety/services/safetyService";
import { useUnmatch, useBlockUser, useReportUser } from "@/features/safety/hooks/useSafety";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SafetyMenuProps {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  matchId: string | null;
}

const SafetyMenu = ({ currentUserId, partnerId, partnerName, matchId }: SafetyMenuProps) => {
  const navigate = useNavigate();
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");

  const unmatch = useUnmatch();
  const block = useBlockUser();
  const report = useReportUser();

  const handleUnmatch = () => {
    if (!matchId) return;
    unmatch.mutate(
      { matchId, userId: currentUserId },
      { onSuccess: () => navigate("/chat") }
    );
  };

  const handleBlock = () => {
    block.mutate(
      { blockerId: currentUserId, blockedId: partnerId },
      {
        onSuccess: () => {
          // Auto-unmatch on block when in a match
          if (matchId) unmatch.mutate({ matchId, userId: currentUserId });
          navigate("/chat");
        },
      }
    );
  };

  const handleSubmitReport = () => {
    if (!reason) return;
    report.mutate(
      {
        reporterId: currentUserId,
        reportedId: partnerId,
        reason,
        details,
        matchId,
      },
      {
        onSuccess: () => {
          setReportOpen(false);
          setReason(null);
          setDetails("");
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Conversation options"
            className="w-[36px] h-[36px] rounded-[var(--radius-full)] bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-all hover:bg-primary/10 hover:text-primary"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {matchId && (
            <DropdownMenuItem onClick={() => setConfirmUnmatch(true)} className="cursor-pointer">
              <UserX className="w-4 h-4 mr-berry-1" />
              Unmatch
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setReportOpen(true)} className="cursor-pointer">
            <Flag className="w-4 h-4 mr-berry-1" />
            Report {partnerName}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmBlock(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Ban className="w-4 h-4 mr-berry-1" />
            Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Unmatch confirm */}
      <AlertDialog open={confirmUnmatch} onOpenChange={setConfirmUnmatch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch {partnerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to this conversation. They won't be notified, but you won't see each other in your chats anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnmatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block confirm */}
      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {partnerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see each other anywhere on Berry — no profile, no chat, no matches. This also unmatches you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report {partnerName}</DialogTitle>
            <DialogDescription>
              Reports are confidential. Our team reviews every one to keep Berry safe 🍓
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-berry-2 py-berry-1">
            <Label className="text-[var(--text-sm)] font-semibold">What happened?</Label>
            <div className="grid grid-cols-1 gap-[6px] max-h-[260px] overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "text-left px-berry-2 py-berry-1 rounded-[var(--radius-md)] border text-[var(--text-sm)] transition-all active:scale-[0.99]",
                    reason === r
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="space-y-[6px]">
              <Label htmlFor="report-details" className="text-[var(--text-sm)] font-semibold">
                Add details (optional)
              </Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                placeholder="Tell us more so we can act faster…"
                className="resize-none"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground text-right">{details.length}/1000</p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setReportOpen(false)}
              className="px-berry-2 py-berry-1 text-[var(--text-sm)] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <BerryButton
              onClick={handleSubmitReport}
              disabled={!reason || report.isPending}
            >
              {report.isPending ? "Sending…" : "Send report"}
            </BerryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SafetyMenu;
