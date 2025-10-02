import * as yup from "yup";
import type { UploadedFile } from "../store/uploads";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["application/pdf"];

export const fileSchema = yup
  .object({
    name: yup.string().required(),
    size: yup.number().max(MAX_SIZE, "El archivo supera 5 MB").required(),
    type: yup.string().oneOf(ALLOWED, "Solo se permite PDF").required(),
  })
  .required();

export async function validateFileLike(fileLike: UploadedFile): Promise<void> {
  // Lanza ValidationError si no cumple
  await fileSchema.validate(fileLike);
}

export function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
