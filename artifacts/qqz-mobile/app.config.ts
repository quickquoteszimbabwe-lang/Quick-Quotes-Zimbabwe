import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    (replitDomain ? `https://${replitDomain}/api-server` : "");

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
