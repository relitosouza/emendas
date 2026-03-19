export type SectorColorScheme = {
  iconBg: string;
  iconText: string;
  iconHoverBg: string;
  iconHoverText: string;
  bar: string;
  badgeBg: string;
  badgeText: string;
};

// Fixed color palette per category code (matches categoryMap in page.tsx)
export const SECTOR_COLORS: Record<string, SectorColorScheme> = {
  "1": { iconBg: "bg-slate-50", iconText: "text-slate-600", iconHoverBg: "group-hover:bg-slate-600", iconHoverText: "group-hover:text-white", bar: "bg-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  "2": { iconBg: "bg-slate-50", iconText: "text-slate-600", iconHoverBg: "group-hover:bg-slate-600", iconHoverText: "group-hover:text-white", bar: "bg-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  "3": { iconBg: "bg-violet-50", iconText: "text-violet-600", iconHoverBg: "group-hover:bg-violet-600", iconHoverText: "group-hover:text-white", bar: "bg-violet-500", badgeBg: "bg-violet-100", badgeText: "text-violet-700" },
  "4": { iconBg: "bg-slate-50", iconText: "text-slate-600", iconHoverBg: "group-hover:bg-slate-600", iconHoverText: "group-hover:text-white", bar: "bg-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  "5": { iconBg: "bg-slate-50", iconText: "text-slate-700", iconHoverBg: "group-hover:bg-slate-700", iconHoverText: "group-hover:text-white", bar: "bg-slate-600", badgeBg: "bg-slate-100", badgeText: "text-slate-700" },
  "6": { iconBg: "bg-rose-50", iconText: "text-rose-600", iconHoverBg: "group-hover:bg-rose-600", iconHoverText: "group-hover:text-white", bar: "bg-rose-500", badgeBg: "bg-rose-100", badgeText: "text-rose-700" },
  "7": { iconBg: "bg-cyan-50", iconText: "text-cyan-600", iconHoverBg: "group-hover:bg-cyan-600", iconHoverText: "group-hover:text-white", bar: "bg-cyan-500", badgeBg: "bg-cyan-100", badgeText: "text-cyan-700" },
  "8": { iconBg: "bg-pink-50", iconText: "text-pink-600", iconHoverBg: "group-hover:bg-pink-600", iconHoverText: "group-hover:text-white", bar: "bg-pink-500", badgeBg: "bg-pink-100", badgeText: "text-pink-700" },
  "9": { iconBg: "bg-orange-50", iconText: "text-orange-600", iconHoverBg: "group-hover:bg-orange-600", iconHoverText: "group-hover:text-white", bar: "bg-orange-500", badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  "10": { iconBg: "bg-emerald-50", iconText: "text-emerald-600", iconHoverBg: "group-hover:bg-emerald-600", iconHoverText: "group-hover:text-white", bar: "bg-emerald-500", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  "11": { iconBg: "bg-teal-50", iconText: "text-teal-600", iconHoverBg: "group-hover:bg-teal-600", iconHoverText: "group-hover:text-white", bar: "bg-teal-500", badgeBg: "bg-teal-100", badgeText: "text-teal-700" },
  "12": { iconBg: "bg-blue-50", iconText: "text-blue-600", iconHoverBg: "group-hover:bg-blue-600", iconHoverText: "group-hover:text-white", bar: "bg-blue-500", badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  "13": { iconBg: "bg-fuchsia-50", iconText: "text-fuchsia-600", iconHoverBg: "group-hover:bg-fuchsia-600", iconHoverText: "group-hover:text-white", bar: "bg-fuchsia-500", badgeBg: "bg-fuchsia-100", badgeText: "text-fuchsia-700" },
  "14": { iconBg: "bg-rose-50", iconText: "text-rose-600", iconHoverBg: "group-hover:bg-rose-600", iconHoverText: "group-hover:text-white", bar: "bg-rose-500", badgeBg: "bg-rose-100", badgeText: "text-rose-700" },
  "15": { iconBg: "bg-amber-50", iconText: "text-amber-600", iconHoverBg: "group-hover:bg-amber-600", iconHoverText: "group-hover:text-white", bar: "bg-amber-500", badgeBg: "bg-amber-100", badgeText: "text-amber-700" },
  "16": { iconBg: "bg-yellow-50", iconText: "text-yellow-600", iconHoverBg: "group-hover:bg-yellow-600", iconHoverText: "group-hover:text-white", bar: "bg-yellow-500", badgeBg: "bg-yellow-100", badgeText: "text-yellow-700" },
  "17": { iconBg: "bg-sky-50", iconText: "text-sky-600", iconHoverBg: "group-hover:bg-sky-600", iconHoverText: "group-hover:text-white", bar: "bg-sky-500", badgeBg: "bg-sky-100", badgeText: "text-sky-700" },
  "18": { iconBg: "bg-green-50", iconText: "text-green-600", iconHoverBg: "group-hover:bg-green-600", iconHoverText: "group-hover:text-white", bar: "bg-green-500", badgeBg: "bg-green-100", badgeText: "text-green-700" },
  "19": { iconBg: "bg-indigo-50", iconText: "text-indigo-600", iconHoverBg: "group-hover:bg-indigo-600", iconHoverText: "group-hover:text-white", bar: "bg-indigo-500", badgeBg: "bg-indigo-100", badgeText: "text-indigo-700" },
  "20": { iconBg: "bg-lime-50", iconText: "text-lime-600", iconHoverBg: "group-hover:bg-lime-600", iconHoverText: "group-hover:text-white", bar: "bg-lime-500", badgeBg: "bg-lime-100", badgeText: "text-lime-700" },
  "21": { iconBg: "bg-emerald-50", iconText: "text-emerald-600", iconHoverBg: "group-hover:bg-emerald-600", iconHoverText: "group-hover:text-white", bar: "bg-emerald-500", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  "22": { iconBg: "bg-zinc-50", iconText: "text-zinc-600", iconHoverBg: "group-hover:bg-zinc-600", iconHoverText: "group-hover:text-white", bar: "bg-zinc-500", badgeBg: "bg-zinc-100", badgeText: "text-zinc-600" },
  "23": { iconBg: "bg-blue-50", iconText: "text-blue-600", iconHoverBg: "group-hover:bg-blue-600", iconHoverText: "group-hover:text-white", bar: "bg-blue-500", badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  "24": { iconBg: "bg-cyan-50", iconText: "text-cyan-600", iconHoverBg: "group-hover:bg-cyan-600", iconHoverText: "group-hover:text-white", bar: "bg-cyan-500", badgeBg: "bg-cyan-100", badgeText: "text-cyan-700" },
  "25": { iconBg: "bg-amber-50", iconText: "text-amber-600", iconHoverBg: "group-hover:bg-amber-600", iconHoverText: "group-hover:text-white", bar: "bg-amber-500", badgeBg: "bg-amber-100", badgeText: "text-amber-700" },
  "26": { iconBg: "bg-slate-50", iconText: "text-slate-600", iconHoverBg: "group-hover:bg-slate-600", iconHoverText: "group-hover:text-white", bar: "bg-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  "27": { iconBg: "bg-violet-50", iconText: "text-violet-600", iconHoverBg: "group-hover:bg-violet-600", iconHoverText: "group-hover:text-white", bar: "bg-violet-500", badgeBg: "bg-violet-100", badgeText: "text-violet-700" },
  "28": { iconBg: "bg-zinc-50", iconText: "text-zinc-600", iconHoverBg: "group-hover:bg-zinc-600", iconHoverText: "group-hover:text-white", bar: "bg-zinc-500", badgeBg: "bg-zinc-100", badgeText: "text-zinc-600" },
  "99": { iconBg: "bg-slate-50", iconText: "text-slate-600", iconHoverBg: "group-hover:bg-slate-600", iconHoverText: "group-hover:text-white", bar: "bg-slate-500", badgeBg: "bg-slate-100", badgeText: "text-slate-600" },
  "Saúde": { iconBg: "bg-emerald-50", iconText: "text-emerald-600", iconHoverBg: "group-hover:bg-emerald-600", iconHoverText: "group-hover:text-white", bar: "bg-emerald-500", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  "Educação": { iconBg: "bg-blue-50", iconText: "text-blue-600", iconHoverBg: "group-hover:bg-blue-600", iconHoverText: "group-hover:text-white", bar: "bg-blue-500", badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  "Infraestrutura": { iconBg: "bg-amber-50", iconText: "text-amber-600", iconHoverBg: "group-hover:bg-amber-600", iconHoverText: "group-hover:text-white", bar: "bg-amber-500", badgeBg: "bg-amber-100", badgeText: "text-amber-700" },
  "Segurança": { iconBg: "bg-slate-50", iconText: "text-slate-700", iconHoverBg: "group-hover:bg-slate-700", iconHoverText: "group-hover:text-white", bar: "bg-slate-600", badgeBg: "bg-slate-100", badgeText: "text-slate-700" },
  "Cultura": { iconBg: "bg-fuchsia-50", iconText: "text-fuchsia-600", iconHoverBg: "group-hover:bg-fuchsia-600", iconHoverText: "group-hover:text-white", bar: "bg-fuchsia-500", badgeBg: "bg-fuchsia-100", badgeText: "text-fuchsia-700" },
  "Assistência Social": { iconBg: "bg-pink-50", iconText: "text-pink-600", iconHoverBg: "group-hover:bg-pink-600", iconHoverText: "group-hover:text-white", bar: "bg-pink-500", badgeBg: "bg-pink-100", badgeText: "text-pink-700" },
  "Esporte": { iconBg: "bg-orange-50", iconText: "text-orange-600", iconHoverBg: "group-hover:bg-orange-600", iconHoverText: "group-hover:text-white", bar: "bg-orange-500", badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  "Meio Ambiente": { iconBg: "bg-green-50", iconText: "text-green-600", iconHoverBg: "group-hover:bg-green-600", iconHoverText: "group-hover:text-white", bar: "bg-green-500", badgeBg: "bg-green-100", badgeText: "text-green-700" },
};

const DEFAULT: SectorColorScheme = {
  iconBg: "bg-blue-50", iconText: "text-blue-600",
  iconHoverBg: "group-hover:bg-blue-600", iconHoverText: "group-hover:text-white",
  bar: "bg-blue-500", badgeBg: "bg-blue-100", badgeText: "text-blue-700",
};

export function getSectorColor(cat: string | null | undefined): SectorColorScheme {
  if (!cat) return DEFAULT;

  // Try exact match first
  if (SECTOR_COLORS[cat]) return SECTOR_COLORS[cat];

  // Try case-insensitive substring match to map variations correctly
  const upperCat = cat.toUpperCase();
  if (upperCat.includes("SAÚDE") || upperCat.includes("SAUDE")) return SECTOR_COLORS["Saúde"];
  if (upperCat.includes("EDUCAÇÃO") || upperCat.includes("EDUCACAO")) return SECTOR_COLORS["Educação"];
  if (upperCat.includes("INFRAESTRUTURA") || upperCat.includes("URBANISMO") || upperCat.includes("HABITAÇÃO")) return SECTOR_COLORS["Infraestrutura"];
  if (upperCat.includes("SEGURANÇA")) return SECTOR_COLORS["Segurança"];
  if (upperCat.includes("CULTURA")) return SECTOR_COLORS["Cultura"];
  if (upperCat.includes("ASSISTÊNCIA") || upperCat.includes("ASSISTENCIA")) return SECTOR_COLORS["Assistência Social"];
  if (upperCat.includes("ESPORTE") || upperCat.includes("LAZER") || upperCat.includes("DESPORTO")) return SECTOR_COLORS["Esporte"];
  if (upperCat.includes("AMBIENTE") || upperCat.includes("AMBIENTAL")) return SECTOR_COLORS["Meio Ambiente"];

  return DEFAULT;
}
