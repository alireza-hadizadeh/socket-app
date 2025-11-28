export type ChannelMessagePayload = {
  channel: string; // e.g. "chat:123"
  sender?: string; // e.g. user id
  text: string;
  platform?: string; // "laravel" / "web" / "flutter"
};
