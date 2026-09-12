'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main id="main" className="error-page"><p className="eyebrow">A brief interruption</p><h1>Let’s try again.</h1><p>The page could not be loaded. Please try again in a moment.</p><button className="button" onClick={reset}>Reload this page</button></main>}
