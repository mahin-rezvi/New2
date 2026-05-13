import * as Sentry from "@sentry/nextjs";

export const initSentry = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        Sentry.httpClientIntegration(),
        Sentry.captureConsoleIntegration(),
      ],
    });
  }
};

export const captureException = (error: any, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  });
};

export const captureMessage = (message: string, level: "info" | "warning" | "error" = "info") => {
  Sentry.captureMessage(message, level);
};
