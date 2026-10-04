import { useState, useEffect } from 'react';

let globalTestBannerVisible = false;

export const setTestBannerVisible = (val: boolean) => {
  globalTestBannerVisible = val;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('domain:testBannerChange'));
  }
};

export const useTestBannerVisible = () => {
  const [visible, setVisible] = useState(globalTestBannerVisible);

  useEffect(() => {
    const handleEvent = () => setVisible(globalTestBannerVisible);
    window.addEventListener('domain:testBannerChange', handleEvent);
    return () => window.removeEventListener('domain:testBannerChange', handleEvent);
  }, []);

  return [visible, setTestBannerVisible] as const;
};
