import type { ComponentType } from "react";
import Dia01Botones from "./day1_buttons";

export type Task = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  Component: ComponentType<any>;
};

export const tasks: Task[] = [
  {
    slug: "dia-01-botones",
    title: "Día 1 – Botones básicos",
    date: "2025-09-26",
    Component: Dia01Botones,
  },
];
