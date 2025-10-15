export default defineEventHandler(async (event) => {
    const url = `/api/swagger.json`
    // Use CDN for swagger-ui assets to avoid serving static files from the server
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${url}',
        dom_id: '#swagger-ui'
      })
    }
  </script>
</body>
</html>`
    return html
})
