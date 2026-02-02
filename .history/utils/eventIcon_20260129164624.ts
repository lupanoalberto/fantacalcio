// utils/eventIcon.tsx
import React from "react";

// ✅ esempi: cambia/aggiungi i tuoi svg
import GoalSvg from "@/assets/svg/events/goal.svg";
import PenaltyGoalSvg from "@/assets/svg/events/penalty-goal.svg";
import OwnGoalSvg from "@/assets/svg/events/own-goal.svg";
import YellowCardSvg from "@/assets/svg/events/yellow-card.svg";
import RedCardSvg from "@/assets/svg/events/red-card.svg";
import SubSvg from "@/assets/svg/events/substitution.svg";
import VarSvg from "@/assets/svg/events/var.svg";
import MissedPenSvg from "@/assets/svg/events/missed-penalty.svg";
import DefaultSvg from "@/assets/svg/events/default.svg";

type SvgComp = React.ComponentType<{ width?: number; height?: number }>;

function norm(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

/**
 * API-FOOTBALL: event.type (Goal, Card, subst, Var, etc)
 * API-FOOTBALL: event.detail (Normal Goal, Own Goal, Yellow Card, Red Card, Penalty, Missed Penalty, Substitution, etc)
 */
export function getEventSvg(event: { type?: string; detail?: string }): SvgComp {
  const type = norm(event.type);
  const detail = norm(event.detail);

  // GOAL
  if (type === "goal") {
    if (detail.includes("penalty")) return PenaltyGoalSvg;
    if (detail.includes("own")) return OwnGoalSvg;
    return GoalSvg;
  }

  // CARD
  if (type === "card") {
    if (detail.includes("yellow")) return YellowCardSvg;
    if (detail.includes("red")) return RedCardSvg;
    return DefaultSvg;
  }

  // SUBSTITUTION (api-football spesso usa type="subst")
  if (type === "subst" || detail.includes("substitution")) {
    return SubSvg;
  }

  // VAR
  if (type === "var" || detail.includes("var")) {
    return VarSvg;
  }

  // MISSED PENALTY
  if (detail.includes("missed penalty")) {
    return MissedPenSvg;
  }

  return DefaultSvg;
}

/**
 * Se vuoi anche una label “pulita” (opzionale):
 * invece di mostrare event.detail raw, mostri questa.
 */
export function getEventLabel(event: { type?: string; detail?: string }) {
  const type = norm(event.type);
  const detail = norm(event.detail);

  if (type === "goal") {
    if (detail.includes("penalty")) return "Rigore";
    if (detail.includes("own")) return "Autogol";
    return "Gol";
  }

  if (type === "card") {
    if (detail.includes("yellow")) return "Giallo";
    if (detail.includes("red")) return "Rosso";
    return "Cartellino";
  }

  if (type === "subst") return "Cambio";
  if (type === "var") return "VAR";

  return (event.detail ?? event.type ?? "Evento").toString();
}
