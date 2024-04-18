const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware(['/gremlin', '/login', '/logout', '/refresh_token', '/status', '/ui-api', '/submit'], {
      target: 'http://localhost:8081',
      changeOrigin: true,
      ws: true,
    })
  );
  // Additional proxies can be added here
};
