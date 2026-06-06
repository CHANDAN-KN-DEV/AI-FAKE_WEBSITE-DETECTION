// Placeholder i18n service – real implementation would call Gemini/Google Translate
export async function translateText(text: string, targetLang: string) {
  // TODO: integrate with Gemini or Google Cloud Translate
  return { translatedText: text, sourceLang: "auto", targetLang, provider: "stub" };
}

export async function transcribeAudio(audioUrl: string, targetLang = "en") {
  // TODO: integrate with Google Speech-to-Text or Gemini multimodal
  return { transcript: "", audioUrl, targetLang, provider: "stub" };
}
