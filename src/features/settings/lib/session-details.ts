export type SessionDetails = Readonly<{
  deviceLabel: string;
  browserLabel: string;
}>;

function detectBrowser(userAgent: string) {
  if (userAgent.includes("Edg/")) {
    return "Microsoft Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Google Chrome";
  }

  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
    return "Safari";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  return "Web Browser";
}

function detectDevice(userAgent: string) {
  if (userAgent.includes("Windows")) {
    return "Windows Device";
  }

  if (userAgent.includes("Mac OS X")) {
    return "Mac Device";
  }

  if (userAgent.includes("iPhone")) {
    return "iPhone";
  }

  if (userAgent.includes("Android")) {
    return "Android Device";
  }

  if (userAgent.includes("Linux")) {
    return "Linux Device";
  }

  return "Current Device";
}

export function getSessionDetails(userAgent: string | null): SessionDetails {
  if (!userAgent) {
    return {
      deviceLabel: "Current Device",
      browserLabel: "Web Browser",
    };
  }

  return {
    deviceLabel: detectDevice(userAgent),
    browserLabel: detectBrowser(userAgent),
  };
}
