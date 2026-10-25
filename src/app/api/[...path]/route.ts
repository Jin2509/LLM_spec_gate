/**
 * src/app/api/[...path]/route.ts — Proxy duy nhất cho mọi endpoint /api/* (xem api.md).
 */
import { proxyToBackend } from "@/lib/server/backend-proxy";

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
