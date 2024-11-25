import localFont from "next/font/local";
import "./globals.css";


export const metadata = {
  title: "Crypto Trading Simulator",
  description: "Simulate crypto trading with dynamic indicators",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className=" antialiased bg-gray-100 text-gray-900"
      >
        <header className="p-4 bg-gray-800 text-white text-center">
          <h1>Crypto Trading Simulator</h1>
        </header>
        <main className="">{children}</main>
        <footer className="p-4 bg-gray-800 text-white text-center">
          <p>© 2025 Crypto Trading Simulator</p>
        </footer>
      </body>
    </html>
  );
}
