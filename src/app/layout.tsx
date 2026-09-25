import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Courier | Good things, carried together",
        template: "%s | Courier",
    },
    description:
        "Connect with a traveler already heading your way and get the things you need delivered with care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
