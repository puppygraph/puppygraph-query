package lib

import (
	"fmt"
	"log"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type user struct {
	Username string
	PWToken  string
}

func InitJwtMiddleware(secretKey string, timeout time.Duration) *jwt.GinJWTMiddleware {
	type login struct {
		Username string `form:"username" json:"username" binding:"required"`
		Password string `form:"password" json:"password" binding:"required"`
	}

	// the jwt middleware
	authMiddleware, err := jwt.New(&jwt.GinJWTMiddleware{
		Realm:      "puppygraph",
		Key:        []byte(secretKey),
		Timeout:    timeout,
		MaxRefresh: 0,
		Authenticator: func(c *gin.Context) (interface{}, error) {
			var loginVals login
			if err := c.ShouldBind(&loginVals); err != nil {
				return "", jwt.ErrMissingLoginValues
			}
			username := loginVals.Username
			password := loginVals.Password

			v, exists := c.Get("conf")
			if !exists {
				return "", fmt.Errorf("cannot load config")
			}
			conf := v.(*Config)
			if conf.Authentication.GremlinAuth {
				err := GremlinAuthCheck(conf, username, password)
				if err != nil {
					logrus.Errorf("login error: %v", err)
					return "", err
				}
			} else {
				if username != conf.Authentication.Admin.Username || password != conf.Authentication.Admin.Password {
					return "", jwt.ErrFailedAuthentication
				}
			}

			pwtoken, err := Encrypt([]byte(secretKey), password)
			if err != nil {
				logrus.Errorf("failed to encrypt: %v", err)
				return "", err
			}

			user := user{Username: username, PWToken: pwtoken}
			return &user, nil
		},
		PayloadFunc: func(data interface{}) jwt.MapClaims {
			// NOTE: When USE_GREMLIN_AUTH is enabled, this stored the encrypted password in JWT for later gremlin query authentication.
			if v, ok := data.(*user); ok {
				return jwt.MapClaims{
					"username": v.Username,
					"pwtoken":  v.PWToken,
				}
			}
			return jwt.MapClaims{}
		},
		IdentityHandler: func(c *gin.Context) interface{} {
			claims := jwt.ExtractClaims(c)
			return &user{
				Username: claims["username"].(string),
				PWToken:  claims["pwtoken"].(string),
			}
		},
		TokenLookup: "header: Authorization, cookie: jwt",
		SendCookie:  true,
	})

	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}

	errInit := authMiddleware.MiddlewareInit()

	if errInit != nil {
		log.Fatal("authMiddleware.MiddlewareInit() Error:" + errInit.Error())
	}

	return authMiddleware
}
