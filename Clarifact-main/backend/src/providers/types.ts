export type ProviderName = "jina" | "gemini" | "grok" | "openrouter" | "hive";

export type PromptTask =
  | "claim-extraction"
  | "emotional-manipulation-analysis"
  | "source-credibility"
  | "final-verdict-summary"
  | "image-analysis"
  | "instagram-analysis"
  | "video-analysis";

export type ProviderCallInput = {
  task: PromptTask;
  prompt: string;
  input: {
    text?: string;
    url?: string;
    mediaUrl?: string;
    metadata?: Record<string, unknown> & {
      imageBase64?: string;
      imageMimeType?: string;
      videoBase64?: string;
      videoMimeType?: string;
    };
  };
};

export type ProviderCallMeta = {
  provider: ProviderName;
  model?: string;
  promptVersion: string;
  latencyMs: number;
  usedMock: boolean;
};

export type ProviderCallResult = {
  meta: ProviderCallMeta;
  json: unknown;
  rawText?: string;
};

export interface AIProvider {
  name: ProviderName;
  call(input: ProviderCallInput): Promise<ProviderCallResult>;
}

