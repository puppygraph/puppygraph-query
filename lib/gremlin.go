package lib

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	gremlingo "github.com/apache/tinkerpop/gremlin-go/driver"
	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Gremlin logger adaptor. For healthcheck the logs are not important.
type loggerAdaptor struct{}

// Log implements gremlingo.Logger.
func (*loggerAdaptor) Log(verbosity gremlingo.LogVerbosity, v ...interface{}) {
	if verbosity >= gremlingo.Warning {
		logrus.Debug(v...)
	}
}

// Logf implements gremlingo.Logger.
func (*loggerAdaptor) Logf(verbosity gremlingo.LogVerbosity, format string, v ...interface{}) {
	if verbosity >= gremlingo.Warning {
		logrus.Debugf(format, v...)
	}
}

func GetWsUrl(config *Config) string {
	if config.GremlinServer.Url != "" {
		return config.GremlinServer.Url
	} else {
		return "ws://" + config.GremlinServer.Host + config.GremlinServer.Path
	}
}

func createConnectionFromContext(c *gin.Context, config *Config) (*gremlingo.DriverRemoteConnection, error) {
	username := ""
	password := ""
	if config.Authentication.GremlinAuth {
		claims := jwt.ExtractClaims(c)
		username = claims["username"].(string)
		pwtoken := claims["pwtoken"].(string)
		var err error
		password, err = Decrypt([]byte(config.Authentication.FrontendJWT.SecretKey), pwtoken)
		if err != nil {
			logrus.Warnf("authentication extraction from JWT failed: %v", err)
			return nil, fmt.Errorf("authentication extraction from JWT failed")
		}
	}
	return createConnection(GetWsUrl(config), username, password, config.GremlinServer.SkipCertVerify)
}

func createConnection(wsUrl string, username string, password string, skipCertVerify bool) (*gremlingo.DriverRemoteConnection, error) {
	return gremlingo.NewDriverRemoteConnection(
		wsUrl,
		func(settings *gremlingo.DriverRemoteConnectionSettings) {
			settings.Logger = &loggerAdaptor{}
			settings.SerializerType = gremlingo.GraphsonSerializer
			if skipCertVerify {
				settings.TlsConfig = &tls.Config{InsecureSkipVerify: true}
			}
			if username != "" {
				settings.AuthInfo = gremlingo.BasicAuthInfo(username, password)
			}
		})
}

func GremlinAuthCheck(config *Config, username string, password string) error {
	driverRemoteConnection, err := createConnection(GetWsUrl(config), username, password, config.GremlinServer.SkipCertVerify)
	// Handle error
	if err != nil {
		return fmt.Errorf("unable to connect to gremlin server: %v", err)
	}
	// Cleanup
	defer driverRemoteConnection.Close()

	query := "1"
	optionsBuilder := gremlingo.RequestOptionsBuilder{}
	for key, value := range config.GremlinServer.Aliases {
		optionsBuilder.AddAliases(key, value)
	}
	resultSet, err := driverRemoteConnection.SubmitWithOptions(query, optionsBuilder.Create())
	if err != nil {
		return fmt.Errorf("unable to submit to gremlin server: %v", err)
	}
	if resultSet.GetError() != nil {
		return fmt.Errorf("gremlin server returns error: %v", resultSet.GetError())
	}
	result, err := resultSet.All()
	if err != nil {
		logrus.Warnf("gremlin response error: %v", err)
		msg, _ := parseGremlinError(err)
		return fmt.Errorf("%s", msg)
	}
	if len(result) != 1 {
		return fmt.Errorf("gremlin returns more than one result: %d", len(result))
	}
	return nil
}

// Checks whether the server can run any gremlin query.
// When v is not empty, checks the g.V() returns something.
func Healthcheck(c *gin.Context, config *Config) (bool, error) {
	driverRemoteConnection, err := createConnectionFromContext(c, config)
	// Handle error
	if err != nil {
		return false, err
	}
	// Cleanup
	defer driverRemoteConnection.Close()

	query := "g.V().id().limit(10)"
	optionsBuilder := gremlingo.RequestOptionsBuilder{}
	for key, value := range config.GremlinServer.Aliases {
		optionsBuilder.AddAliases(key, value)
	}
	resultSet, err := driverRemoteConnection.SubmitWithOptions(query, optionsBuilder.Create())
	if err != nil {
		return false, err
	}

	if resultSet.IsEmpty() {
		return false, nil
	}
	// Print the result
	if logrus.IsLevelEnabled(logrus.DebugLevel) {
		result, err := resultSet.All()
		if err != nil {
			logrus.Debugf("error when getting all the results of the query: %v", err)
		}
		for _, r := range result {
			logrus.Debug(r)
		}
	}

	return true, nil
}

// Assuming GSON response from Gremlin server is always a list.
type GsonResponse struct {
	Type  string            `json:"@type"`
	Value []json.RawMessage `json:"@value"`
}

func Submit(c *gin.Context, config *Config, query string) (*GsonResponse, error) {
	// Use graphson serializer and the client side will handle gson directly.
	driverRemoteConnection, err := createConnectionFromContext(c, config)
	// Handle error
	if err != nil {
		return nil, err
	}
	// Cleanup
	defer driverRemoteConnection.Close()

	optionsBuilder := gremlingo.RequestOptionsBuilder{}
	for key, value := range config.GremlinServer.Aliases {
		optionsBuilder.AddAliases(key, value)
	}
	resultSet, err := driverRemoteConnection.SubmitWithOptions(query, optionsBuilder.Create())
	if err != nil {
		return nil, err
	}
	result, err := resultSet.All()
	if err != nil {
		msg, _ := parseGremlinError(err)
		return nil, fmt.Errorf("%s", msg)
	}

	var response GsonResponse
	for _, r := range result {
		gson := r.GetString()
		var responseSlice GsonResponse
		err := json.Unmarshal([]byte(gson), &responseSlice)
		if err != nil {
			return nil, fmt.Errorf("error when parsing gson response: %v", err)
		}
		response.Type = responseSlice.Type
		response.Value = append(response.Value, responseSlice.Value...)
	}
	return &response, nil
}

func parseGremlinError(err error) (string, string) {
	stacktrace := ""
	errorMsg := err.Error()
	errorCode := strings.Split(err.Error(), ":")[0]
	if errorCode == "E0502" {
		re := regexp.MustCompile(`(?s)E0502: error in read loop, error message \'(.*)\'\. statusCode`)
		match := re.FindStringSubmatch(errorMsg)
		if match != nil && len(match[1]) > 0 {
			errorMsg = match[1]
		}
		statusRe := regexp.MustCompile(`(?s)\{code:(\d+) message:(.*) attributes:map\[(.*)\]\}`)
		statusMatch := statusRe.FindStringSubmatch(errorMsg)
		if statusMatch != nil && len(statusMatch[2]) > 0 {
			errorMsg = statusMatch[2]
		}
		if statusMatch != nil && len(statusMatch[3]) > 0 {
			stacktrace = statusMatch[3]
		}
	} else {
		rsRe := regexp.MustCompile(`(?s)gremlingo\.responseStatus=\{\d+ (.*) map\[(.*)\]\}`)
		match := rsRe.FindStringSubmatch(errorMsg)
		if match != nil && len(match[1]) > 0 {
			errorMsg = match[1]
		}
		if match != nil && len(match[2]) > 0 {
			stacktrace = match[2]
		}
	}
	return errorMsg, stacktrace
}
