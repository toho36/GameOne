import en from "../../../messages/en.json";
import cs from "../../../messages/cs.json";

export const messages = {
  en,
  cs,
} as const;

export type Locale = keyof typeof messages;
