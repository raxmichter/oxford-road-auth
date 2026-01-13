import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface InstagramProfile {
  id: string
  username: string
  account_type: string
  media_count?: number
}

export default function InstagramProvider<P extends InstagramProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    authorization: {
      url: "https://api.instagram.com/oauth/authorize",
      params: {
        scope: "user_profile,user_media",
        response_type: "code",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      async request({ params, provider }) {
        const response = await fetch(provider.token.url as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: options.clientId!,
            client_secret: options.clientSecret!,
            grant_type: "authorization_code",
            redirect_uri: params.redirect_uri || "",
            code: params.code!,
          }),
        })

        const data = await response.json()
        return {
          tokens: {
            access_token: data.access_token,
            token_type: "bearer",
            user_id: data.user_id,
          },
        }
      },
    },
    userinfo: {
      url: "https://graph.instagram.com/me",
      params: {
        fields: "id,username,account_type,media_count",
      },
      async request({ tokens }) {
        const response = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokens.access_token}`
        )
        return await response.json()
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.username,
        image: null,
        email: null,
      }
    },
    style: {
      logo: "/instagram-logo.svg",
      bg: "#E4405F",
      text: "#ffffff",
    },
    options,
  }
}
