import type { Row } from "../store/uploads";

// Archivos simulados (no son File reales; solo metadata)
export const mockRows: Row[] = [
  {
    id: "1",
    label: "Contrato de servicio",
    file: {
      name: "contrato_v1.pdf",
      size: 256_000,
      type: "application/pdf",
      mock: true,
    },
  },
  {
    id: "2",
    label: "Manual de usuario",
    file: null,
  },
  {
    id: "3",
    label: "Política de privacidad",
    file: {
      name: "privacidad.pdf",
      size: 1_024_000,
      type: "application/pdf",
      mock: true,
    },
  },
];
