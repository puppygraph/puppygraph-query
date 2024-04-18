package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"uiserver/lib"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type ServerStatus struct {
	GremlinServer    string
	GremlinHealthy   string
	PrefetchPageSize int
	WatermarkText    string
}

func statusHandler(c *gin.Context) {
	v, exists := c.Get("conf")
	if !exists {
		c.JSON(http.StatusInternalServerError, "Cannot load config")
	}
	config := v.(*lib.Config)

	result := "OK"
	ok, err := lib.Healthcheck(c, config)
	if !ok {
		if err != nil {
			logrus.Infof("Healthcheck error: %v", err)
			result = "Error"
		} else {
			result = "Empty"
		}
	}

	url := lib.GetWsUrl(config)
	status := ServerStatus{
		GremlinServer:    url,
		GremlinHealthy:   result,
		PrefetchPageSize: config.Prefetch.BatchCount * config.Prefetch.BatchSize,
		WatermarkText:    config.Customization.Watermark,
	}
	c.JSON(http.StatusOK, status)
}

type SubmitRequest struct {
	Query string `json:"query"`
}

func submitHandler(c *gin.Context) {
	v, exists := c.Get("conf")
	if !exists {
		c.JSON(http.StatusInternalServerError, "Cannot load config")
	}
	config := v.(*lib.Config)

	var req SubmitRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, "Invalid request")
		return
	}

	response, err := lib.Submit(c, config, req.Query)
	if err != nil {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("gremlin query error: %v", err))
		return
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("gremlin query parse error: %v", err))
		return
	}

	c.Data(http.StatusOK, "application/json", responseBytes)
}

func getPropsHandler(c *gin.Context) {
	v, exists := c.Get("conf")
	if !exists {
		c.JSON(http.StatusInternalServerError, "Cannot load config")
		return
	}
	config := v.(*lib.Config)

	var requestBody struct {
		Type string   `json:"type"`
		IDs  []string `json:"ids"`
	}

	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, "Invalid request body")
		return
	}

	elementType := requestBody.Type
	ids := requestBody.IDs

	if elementType != "V" && elementType != "E" {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("Invalid element type: %s", elementType))
		return
	}

	if len(ids) == 0 {
		c.JSON(http.StatusBadRequest, "Missing ids")
		return
	}

	if len(ids) > config.Prefetch.BatchCount*config.Prefetch.BatchSize {
		c.JSON(http.StatusBadRequest, "Maximum number of ids exceeded")
		return
	}

	batchSize := config.Prefetch.BatchSize
	numBatches := (len(ids) + batchSize - 1) / batchSize
	var combinedResult lib.GsonResponse

	var wg sync.WaitGroup
	wg.Add(numBatches)

	for i := 0; i < numBatches; i++ {
		go func(batchIndex int) {
			defer wg.Done()

			start := batchIndex * batchSize
			end := (batchIndex + 1) * batchSize
			if end > len(ids) {
				end = len(ids)
			}

			batchIDs := ids[start:end]
			quotedIDs := make([]string, len(batchIDs))
			for i, id := range batchIDs {
				quotedIDs[i] = fmt.Sprintf(`"%s"`, id)
			}

			var query string
			if elementType == "V" {
				query = fmt.Sprintf("g.V(%s).elementMap()", strings.Join(quotedIDs, ","))
			} else {
				query = fmt.Sprintf("g.E(%s).elementMap()", strings.Join(quotedIDs, ","))
			}
			result, err := lib.Submit(c, config, query)
			if err != nil {
				c.JSON(http.StatusBadRequest, fmt.Sprintf("Gremlin query error: %v", err))
				return
			}

			combinedResult.Type = result.Type
			combinedResult.Value = append(combinedResult.Value, result.Value...)
		}(i)
	}

	wg.Wait()

	responseBytes, err := json.Marshal(combinedResult)
	if err != nil {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("gremlin query parse error: %v", err))
		return
	}
	c.Data(http.StatusOK, "application/json", responseBytes)
}
