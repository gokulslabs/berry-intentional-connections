import * as React from "react";
import { getScreenAdapter, MOBILE_BREAKPOINT } from "@/lib/platform/screen";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const adapter = getScreenAdapter();
    const update = () => setIsMobile(adapter.getWidth() < MOBILE_BREAKPOINT);
    update();
    const unsubscribe = adapter.subscribe(update);
    return unsubscribe;
  }, []);

  return !!isMobile;
}
