import { connectDB } from "@/db/connection";
import { Providers } from "./clientWrapper";
import "./globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectDB();

  return (
    <html lang="en">
      <body>
        {" "}
        <Providers>
          
          {children}
          
          </Providers>

      </body>
    </html>
  );
}
