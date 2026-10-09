import {
  Box,
  BrainCircuit,
  Bug,
  ChartColumn,
  ClipboardList,
  Cloud,
  Compass,
  Cpu,
  Database,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Megaphone,
  Music,
  Palette,
  PenTool,
  Server,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

// Icon names come from the backend catalog (Data/Seed/competencies.json).
const icons: Record<string, LucideIcon> = {
  Box,
  BrainCircuit,
  Bug,
  ChartColumn,
  ClipboardList,
  Cloud,
  Cpu,
  Database,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Megaphone,
  Music,
  Palette,
  PenTool,
  Server,
  ShieldCheck,
  Smartphone,
}

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Compass
  return <Icon className={className} aria-hidden />
}
