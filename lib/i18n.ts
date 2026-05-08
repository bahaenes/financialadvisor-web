"use client"

import { createContext, useContext } from "react"
import { tr } from "@/messages/tr"
import { en } from "@/messages/en"
import type { Messages } from "@/messages/tr"

export type Language = "TR" | "EN"

export const MESSAGES: Record<Language, Messages> = { TR: tr, EN: en }

export const LanguageContext = createContext<Language>("TR")

export function useT(): Messages {
  const lang = useContext(LanguageContext)
  return MESSAGES[lang] ?? tr
}
