import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Exposure Lab",description:"An interactive exposure-triangle calculator and shooting guide for photographers."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
