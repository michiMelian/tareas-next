import { NextResponse } from "next/server";

export type Doc = {
  id: string;
  title: string;
  category: "Legal" | "Tech" | "Marketing" | "Finance";
  sizeKB: number;
  createdAt: string; // ISO
};

export async function GET() {
  const mock: Doc[] = [
    {
      id: "1",
      title: "Contrato ACME",
      category: "Legal",
      sizeKB: 240,
      createdAt: "2025-09-01T10:00:00Z",
    },
    {
      id: "2",
      title: "Guía Node.js",
      category: "Tech",
      sizeKB: 520,
      createdAt: "2025-09-03T12:00:00Z",
    },
    {
      id: "3",
      title: "Plan Q4",
      category: "Marketing",
      sizeKB: 180,
      createdAt: "2025-09-05T09:30:00Z",
    },
    {
      id: "4",
      title: "Informe costos",
      category: "Finance",
      sizeKB: 310,
      createdAt: "2025-09-07T11:15:00Z",
    },
    {
      id: "5",
      title: "Política privacidad",
      category: "Legal",
      sizeKB: 95,
      createdAt: "2025-09-10T14:05:00Z",
    },
    {
      id: "6",
      title: "Checklist Deploy",
      category: "Tech",
      sizeKB: 260,
      createdAt: "2025-09-12T16:40:00Z",
    },
  ];
  return NextResponse.json({ data: mock });
}
