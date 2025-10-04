import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="de" data-theme="light">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mushroom Manager - Pilzzucht Verwaltung</title>
        
        {/* Tailwind CSS wird durch eigenes CSS ersetzt */}
        
        {/* Font Awesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom Styles */}
        <link href="/static/style.css" rel="stylesheet" />
        
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍄</text></svg>" />
      </head>
      <body className="bg-gray-100 transition-colors duration-300">
        {children}
        
        {/* JavaScript für Dark Mode und Interaktivität */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
