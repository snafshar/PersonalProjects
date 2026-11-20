import type { Metadata } from "next";
export const metadata: Metadata = {title:"Silvergrain Journal",description:"Sina Afshar’s personal photography journal."};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
