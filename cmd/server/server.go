package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"uiserver/lib"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func noCacheMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	}
}

func main() {
	logrus.SetFormatter(&lib.PuppyLogFormatter{ModuleName: "UiServer"})

	conf, err := lib.LoadConfig()
	if err != nil {
		logrus.Fatal("Cannot initialize the config. Exiting.")
	}
	if conf.Debug {
		logrus.SetLevel(logrus.DebugLevel)
	}

	r := gin.Default()

	// for large data size, should rely on client side to run small batch update
	r.MaxMultipartMemory = 8 << 30 // 8GB

	requestScopedMiddleware := func(c *gin.Context) {
		c.Set("conf", conf)
		c.Next()
	}
	r.Use(requestScopedMiddleware)

	jwtMiddleware := lib.InitJwtMiddleware(conf.Authentication.FrontendJWT.SecretKey, conf.Authentication.FrontendJWT.Timeout)

	r.POST("/login", jwtMiddleware.LoginHandler)
	r.POST("/logout", jwtMiddleware.LogoutHandler)
	r.GET("/refresh_token", jwtMiddleware.RefreshHandler)

	auth := func(c *gin.Context) {
		jwtMiddleware.MiddlewareFunc()(c)
	}

	// gremlin reverse proxy
	r.Any("/gremlin", func(c *gin.Context) {
		logrus.Debugf("gremlin: %+v", c.Request)
		v, exists := c.Get("conf")
		if !exists {
			c.JSON(http.StatusInternalServerError, "Cannot load config.")
			return
		}
		conf := v.(*lib.Config)
		origin := "http://" + conf.GremlinServer.Host
		remote, err := url.Parse(origin)
		if err != nil {
			panic(err)
		}

		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.Director = func(req *http.Request) {
			req.Header = c.Request.Header
			req.Header.Set("Origin", origin)
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = conf.GremlinServer.Path
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// html
	r.Use(noCacheMiddleware())
	r.StaticFile("/", "./html/build/index.html")
	r.StaticFile("/index.html", "./html/build/index.html")
	r.StaticFile("/logo.png", "./html/build/logo.png")
	r.StaticFile("/manifest.json", "./html/build/manifest.json")
	r.StaticFile("/robots.txt", "./html/build/robots.txt")
	r.Static("/static", "./html/build/static")

	r.GET("/status", auth, statusHandler)
	r.POST("/submit", auth, submitHandler)
	r.POST("/ui-api/props", auth, getPropsHandler)

	r.Run(fmt.Sprintf(":%d", conf.Port))
}
