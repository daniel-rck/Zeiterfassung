import { useEffect } from "react";
import { useToast } from "./ui/Toast";

export function SwUpdateNotifier() {
  const toast = useToast();

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const initialController = sw.controller;
    if (!initialController) return; // first install, no update to announce

    const onChange = () => {
      toast.success("Neue Version installiert.", {
        duration: 20_000,
        action: { label: "Neu laden", onClick: () => window.location.reload() },
      });
    };
    sw.addEventListener("controllerchange", onChange);
    return () => sw.removeEventListener("controllerchange", onChange);
  }, [toast]);

  return null;
}
