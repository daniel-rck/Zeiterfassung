import type { ReactNode } from "react";
import { useDetailLevel } from "../lib/hooks/useDetailLevel";
import { useFeature } from "../lib/hooks/useFeature";
import type { DetailLevel, FeatureName } from "../lib/types";

interface GatedLevelProps {
  level: DetailLevel;
  feature?: never;
  fallback?: ReactNode;
  children: ReactNode;
}

interface GatedFeatureProps {
  feature: FeatureName;
  level?: never;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Gated(props: GatedLevelProps | GatedFeatureProps) {
  if ("feature" in props && props.feature) {
    return <GatedByFeature {...props} />;
  }
  return <GatedByLevel {...(props as GatedLevelProps)} />;
}

function GatedByLevel({ level, fallback = null, children }: GatedLevelProps) {
  const { atLeast } = useDetailLevel();
  if (!atLeast(level)) return <>{fallback}</>;
  return <>{children}</>;
}

function GatedByFeature({ feature, fallback = null, children }: GatedFeatureProps) {
  const enabled = useFeature(feature);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}
