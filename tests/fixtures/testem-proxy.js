const httpProxy = require('http-proxy');

/*
  This can be installed as a testem middleware to make testem run against an
  arbitrary real webserver at targetURL.

  It allows testem to handle the well-known testem-specific paths and proxies
  everything else, while rewriting the testem-added prefix out of your
  "/tests/index.html" URL.
*/

module.exports.testemProxy = function testemProxy(targetURL, base = '/') {
  return function testemProxyHandler(app) {
    const proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      ignorePath: true,
    });

    proxy.on('error', (err, _req, res) => {
      res && res.status && res.status(500).json(err);
    });

    app.all('*', (req, res, next) => {
      let url = req.url;
      if (url === `${base}testem.js` || url.startsWith('/testem/')) {
        req.url = req.url.replace(base, '/');
        return next();
      }
      let m = /^(\/\d+).*\/tests($|.)+/.exec(url);
      if (m) {
        url = url.slice(m[1].length);
      }
      proxy.web(req, res, { target: targetURL + url });
    });
  };
};
