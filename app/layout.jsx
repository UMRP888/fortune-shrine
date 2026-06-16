import "./globals.css";

export const metadata = {
  title: "Fortune Shrine",
  description: "A digital blessing shrine before stepping into the unknown."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
