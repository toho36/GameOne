import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number | any) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json({ success: true, data }, responseInit);
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function unauthorized(message = "Authentication required") {
  return error(message, 401);
}

export function forbidden(message = "Insufficient permissions") {
  return error(message, 403);
}

export function notFound(message = "Resource not found") {
  return error(message, 404);
}
