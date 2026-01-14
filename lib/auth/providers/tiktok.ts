import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface TikTokProfile {
  data: {
    user: {
      open_id: string
      union_id: string
      avatar_url: string
      avatar_url_100: string
      avatar_large_url: string
      display_name: string
    }
  }
}

export default function TikTokProvider<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    authorization: {
      url: "https://www.tiktok.com/v2/auth/authorize",
      params: {
        client_key: options.clientId,
        scope: "user.info.basic,user.info.profile,video.list",
        response_type: "code",
      },
    },
    token: {
      url: "https://open.tiktokapis.com/v2/oauth/token/",
      async request({ params, provider }) {
        const response = await fetch(provider.token.url as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_key: options.clientId!,
            client_secret: options.clientSecret!,
            code: params.code!,
            grant_type: "authorization_code",
            redirect_uri: params.redirect_uri || "",
          }),
        })

        const tokens = await response.json()
        return {
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type,
            scope: tokens.scope,
          },
        }
      },
    },
    userinfo: {
      url: "https://open.tiktokapis.com/v2/user/info/",
      params: {
        fields: "open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name",
      },
      async request({ tokens }) {
        const response = await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name",
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        )
        return await response.json()
      },
    },
    profile(profile) {
      return {
        id: profile.data.user.open_id,
        name: profile.data.user.display_name,
        image: profile.data.user.avatar_large_url || profile.data.user.avatar_url,
        email: null,
      }
    },
    style: {
      logo: "/tiktok-logo.svg",
      bg: "#000000",
      text: "#ffffff",
    },
    options,
  }
}
