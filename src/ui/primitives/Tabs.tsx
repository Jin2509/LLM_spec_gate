"use client";

import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className = "", style, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`inline-flex items-center gap-1 border-b ${className}`}
    style={{
      borderColor: "var(--rule)",
      backgroundColor: "transparent",
      ...style,
    }}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className = "", style, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`px-3 py-2 text-xs font-mono font-medium transition-all cursor-pointer border-b-2 -mb-[1px] select-none text-[var(--ink-soft)] border-transparent hover:text-[var(--ink)] data-[state=active]:text-[var(--action)] data-[state=active]:border-[var(--action)] data-[state=active]:font-semibold ${className}`}
    style={{
      ...style,
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className = "", style, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={`mt-3 focus-visible:outline-none ${className}`}
    style={{
      color: "var(--ink)",
      ...style,
    }}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
