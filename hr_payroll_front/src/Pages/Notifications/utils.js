export function formatTime(iso) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 1) return "just now";
    if (diff < 60) return `${Math.floor(diff)}m`;
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export function notificationIcon(category) {
  switch (category) {
    case "attendance": return "⏱️";
    case "leave": return "📝";
    case "payroll": return "💰";
    case "hr": return "📢";
    case "system": return "⚙️";
    case "promotion": return "🎉";
    case "policy": return "📜";
    default: return "🔔";
  }
}

export const ROLE_SEND_PERMISSIONS = {
  Manager: [{ content: "attendance" }, { content: "leave" }, { content: "announcement" }],
  Payroll: ["payroll", "announcement"],
  "Line Manager": ["leave", "attendance", "announcement"],
  Employee: [],
};

const status = [
    {content:'All Priority',svg:null,placeholder:true},
    {content:'Low',svg:null},
    {content:'Normal',svg:null},
    {content:'High',svg:null},
    {content:'Urgent',svg:null},
  ];

export const ROLE_RECEIVE_TYPES = {
  Manager: ["attendance", "leave", "system"],
  Payroll: ["payroll", "system"],
  "Line Manager": ["leave", "attendance", "system"],
  Employee: ["leave", "attendance", "system"],
};
// Helper functions (format date/time, filter notifications, sort, etc).