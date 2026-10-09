import {
  BrainCircuit,
  Briefcase,
  Cloud,
  Cog,
  Compass,
  Cpu,
  Gamepad2,
  Globe,
  GraduationCap,
  Palette,
  Scale,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'

// Icon names come from the backend catalog (Data/Seed/catalog.json).
const icons: Record<string, LucideIcon> = {
  BrainCircuit,
  Briefcase,
  Cloud,
  Cog,
  Cpu,
  Gamepad2,
  Globe,
  GraduationCap,
  Palette,
  Scale,
  ShieldCheck,
  Smartphone,
  Stethoscope,
}

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Compass
  return <Icon className={className} aria-hidden />
}
