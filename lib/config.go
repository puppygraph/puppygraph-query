package lib

import (
	"time"

	"github.com/kelseyhightower/envconfig"
	"github.com/sirupsen/logrus"
)

type Config struct {
	Port           int  `default:"8081"`
	Debug          bool `default:"false"`
	Authentication struct {
		GremlinAuth bool `envconfig:"USE_GREMLIN_AUTH" default:"false"`
		Admin       struct {
			Username string `envconfig:"PUPPYGRAPH_USERNAME" default:"puppygraph"`
			Password string `envconfig:"PUPPYGRAPH_PASSWORD" default:"888888"`
		}
		FrontendJWT struct {
			Timeout   time.Duration `default:"24h"`
			SecretKey string        `default:"w74DbQ9ggSjk1VqfmAl9BvXvqj8EMGd6"`
		}
	}
	GremlinServer struct {
		Host           string            `default:"127.0.0.1:8182"`
		Path           string            `default:"/gremlin"`
		Url            string            `defualt:""`
		Aliases        map[string]string `default:""`
		SkipCertVerify bool              `default:"false"`
	}
	Prefetch struct {
		BatchSize  int `default:"100"`
		BatchCount int `default:"10"`
	}
	Customization struct {
		Watermark string `envconfig:"WATERMARK" default:""`
	}
}

func LoadConfig() (*Config, error) {
	var conf Config
	if err := envconfig.Process("", &conf); err != nil {
		logrus.Error("unable to load config", err)
		return nil, err
	}
	return &conf, nil
}
