import type { ComponentType } from "react";
//import Dia01Botones from "./dia-01-botones";
import Dia02TablaUploads from "./day1_buttons";

export type Task = {
  slug: string;
  title: string;
  date: string;
  Component: ComponentType<any>;
};

export const tasks: Task[] = [
  /*  {
    slug: "dia-01-botones",
    title: "Día 1 – Botones básicos",
    date: "2025-09-26",
    Component: Dia01Botones,
  }*/

  {
    slug: "dia-02-tabla-uploads",
    title: "Día 2 – Tabla editable con uploads",
    date: "2025-09-28",
    Component: Dia02TablaUploads,
  },
];
