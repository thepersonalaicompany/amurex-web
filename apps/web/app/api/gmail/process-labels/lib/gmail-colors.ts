interface GmailColorConfig {
  backgroundColor: `#${string}`;
  textColor: `#${string}`;
}

// Gmail label colors
export const GMAIL_COLORS: { readonly [key: string]: GmailColorConfig } = {
  // Using Gmail's standard palette colors:
  // See https://developers.google.com/gmail/api/reference/rest/v1/users.labels for allowed colors
  "to respond": { backgroundColor: "#fb4c2f", textColor: "#ffffff" }, // Red
  FYI: { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  comment: { backgroundColor: "#ffad47", textColor: "#ffffff" }, // Orange
  notification: { backgroundColor: "#42d692", textColor: "#ffffff" }, // Light Green
  "meeting update": { backgroundColor: "#8e63ce", textColor: "#ffffff" }, // Purple (changed from #9334e9)
  "awaiting reply": { backgroundColor: "#ffad47", textColor: "#ffffff" }, // Orange
  actioned: { backgroundColor: "#4986e7", textColor: "#ffffff" }, // Blue
};

// Standard Gmail colors for reference (uncomment if needed):
// const GMAIL_STANDARD_COLORS = {
//   "berry": { "backgroundColor": "#dc2127", "textColor": "#ffffff" },
//   "red": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
//   "orange": { "backgroundColor": "#ffad47", "textColor": "#ffffff" },
//   "yellow": { "backgroundColor": "#fad165", "textColor": "#000000" },
//   "green": { "backgroundColor": "#16a766", "textColor": "#ffffff" },
//   "teal": { "backgroundColor": "#2da2bb", "textColor": "#ffffff" },
//   "blue": { "backgroundColor": "#4986e7", "textColor": "#ffffff" },
//   "purple": { "backgroundColor": "#8e63ce", "textColor": "#ffffff" },
//   "gray": { "backgroundColor": "#999999", "textColor": "#ffffff" },
//   "brown": { "backgroundColor": "#b65775", "textColor": "#ffffff" }
// };
