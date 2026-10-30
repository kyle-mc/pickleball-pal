export const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  bug: "🐛 Bug Report",
  feature: "💡 Feature Request",
  ui_improvement: "🎨 Formatting / UI Improvement",
  other: "📝 Other",
};
export const formatFeedbackType = (t: string) => FEEDBACK_TYPE_LABELS[t] ?? t;
