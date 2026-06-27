import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cmVsYXRlZC1zd2lmdC02NS5jbGVyay5hY2NvdW50cy5kZXYk";

export const metadata: Metadata = {
  title: "Bartendle",
  description: "A daily cocktail recipe guessing game from CloseEnough Games.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
