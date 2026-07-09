export const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  CheckedIn: "Checked In",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Rescheduled: "Rescheduled",
  NoShow: "No Show",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
