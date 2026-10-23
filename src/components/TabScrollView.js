import { useLayoutEffect, useRef } from 'react';
import { ScrollView } from 'react-native';

// Keep each screen mounted (forms/filters stay intact), reset only on tab changes.
export default function TabScrollView({
  active,
  children,
  ...props
}) {
  const scrollRef = useRef(null);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false
    });
  }, [active]);
  return <ScrollView {...props} ref={scrollRef}>{children}</ScrollView>;
}
