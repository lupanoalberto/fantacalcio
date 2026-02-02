// components/EventIcon.tsx
import React from "react";
import { getEventSvg } from "@/utils/eventIcon";

export default function EventIcon({
  type,
  detail,
  size = 24,
}: {
  type?: string;
  detail?: string;
  size?: number;
}) {
  const Icon = getEventSvg({ type, detail });
  return <Icon width={size} height={size} />;
}
