import { AiProvider } from "@/generated/prisma/enums";
import { t, tx } from "@/lib/i18n";

/** The provider cards in Settings → AI provider (SET-1), as in the prototype's `PROVIDERS`. */
export const PROVIDER_OPTIONS: readonly {
  value: AiProvider;
  name: string;
  /** Who receives the data, for the privacy notes; null when it's whoever runs the server. */
  vendor: string | null;
  description: string;
  tag: string;
  /** Runs on the user's own hardware: no notes about data leaving, and one AI job at a time. */
  local: boolean;
  /** Filled in when the card is picked; empty means "type your server's address". */
  defaultUrl: string;
  urlPlaceholder: string;
  /** Shown under the address. */
  urlHint?: string;
  defaultModel: string;
  /** The key field, if the card has one; `hint` says when it's needed. */
  apiKey: { label: string; hint?: string } | null;
}[] = [
  {
    value: AiProvider.LOCAL,
    name: tx("Local model"),
    vendor: null,
    description: tx("Runs on your own hardware through Ollama or llama.cpp."),
    tag: tx("Private · free · slower"),
    local: true,
    defaultUrl: "http://localhost:11434",
    urlPlaceholder: "http://localhost:11434",
    urlHint:
      tx("Dossier in Docker? There, localhost is Dossier's own container: use http://host.docker.internal:11434 for Ollama on this computer, or http://ollama:11434 for the Compose service."),
    defaultModel: "",
    apiKey: null,
  },
  {
    value: AiProvider.LMSTUDIO,
    name: "LM Studio",
    vendor: null,
    description: tx("Models you run in LM Studio, on this computer or your network."),
    tag: tx("Private · free · your hardware"),
    local: true,
    // Dossier runs in Docker, where localhost is its own container.
    defaultUrl: "http://host.docker.internal:1234",
    urlPlaceholder: "http://host.docker.internal:1234",
    urlHint:
      tx("That's LM Studio on the computer Dossier's Docker runs on; without Docker, use http://localhost:1234. Can't connect? Start the server in LM Studio's Developer tab, and turn on Serve on Local Network there."),
    defaultModel: "",
    apiKey: { label: tx("API token"), hint: tx("Only needed if you've turned on authentication in LM Studio's server settings.") },
  },
  {
    value: AiProvider.OPENAI,
    name: "OpenAI-compatible",
    vendor: null,
    description: tx("Any server that speaks the OpenAI API, hosted or on your network."),
    tag: tx("Bring your own endpoint"),
    local: false,
    defaultUrl: "",
    urlPlaceholder: "https://api.openai.com/v1",
    defaultModel: "",
    apiKey: { label: tx("API key") },
  },
  {
    value: AiProvider.ANTHROPIC,
    name: "Anthropic",
    vendor: "Anthropic",
    description: tx("Claude models through your own API key."),
    tag: tx("Hosted · pay per use"),
    local: false,
    defaultUrl: "https://api.anthropic.com",
    urlPlaceholder: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-5",
    apiKey: { label: tx("API key") },
  },
  {
    value: AiProvider.MISTRAL,
    name: "Mistral",
    vendor: "Mistral",
    description: tx("Mistral's models through your own API key."),
    tag: tx("Hosted · free tier to start"),
    local: false,
    defaultUrl: "https://api.mistral.ai/v1",
    urlPlaceholder: "https://api.mistral.ai/v1",
    defaultModel: "mistral-medium-latest",
    apiKey: { label: tx("API key") },
  },
];

type ProviderOption = (typeof PROVIDER_OPTIONS)[number];

/** The words of a card in the app's language (the table itself stays in English). */
function translated(option: ProviderOption): ProviderOption {
  return {
    ...option,
    name: t(option.name),
    description: t(option.description),
    tag: t(option.tag),
    urlHint: option.urlHint === undefined ? undefined : t(option.urlHint),
    apiKey: option.apiKey && { label: t(option.apiKey.label), hint: option.apiKey.hint === undefined ? undefined : t(option.apiKey.hint) },
  };
}

/** The provider cards, in the app's language. */
export const providerOptions = (): readonly ProviderOption[] => PROVIDER_OPTIONS.map(translated);

export function providerOption(provider: AiProvider): ProviderOption {
  return translated(PROVIDER_OPTIONS.find((option) => option.value === provider)!);
}

/** What people see when a saved key can't be decrypted, e.g. after DOSSIER_SECRET changed. */
export const API_KEY_UNREADABLE = tx("Your saved API key can't be read. Please enter it again.");

/** What Settings may know about the API key: never the key itself. */
export type KeyState = "none" | "set" | "unreadable" | "env";

/** What the AI provider section starts from. */
export type AiSettingsView = {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  keyState: KeyState;
};
