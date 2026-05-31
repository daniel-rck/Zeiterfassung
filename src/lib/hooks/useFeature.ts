import type { FeatureName } from "../types";
import { useSettings } from "./useSettings";

export function useFeature(name: FeatureName): boolean {
  const { settings } = useSettings();
  return settings.features[name];
}

export function useFeatures(): Record<FeatureName, boolean> {
  const { settings } = useSettings();
  return settings.features;
}
