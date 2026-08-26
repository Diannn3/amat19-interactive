import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className = '', ...props }: ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={`amat-tabs ${className}`.trim()} {...props} />
);
export const TabsTrigger = ({ className = '', ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={`amat-tabs__trigger ${className}`.trim()} {...props} />
);
export const TabsContent = TabsPrimitive.Content;
