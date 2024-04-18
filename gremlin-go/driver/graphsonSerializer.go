/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

package gremlingo

import (
	"encoding/json"

	"github.com/google/uuid"
)

const graphsonMimeType = "application/vnd.gremlin-v3.0+json"

// graphBinarySerializer serializes/deserializes message to/from GraphBinary.
type graphsonSerializer struct {
	logHandler *logHandler
}

func newGraphsonSerializer(handler *logHandler) Serializer {
	return graphsonSerializer{
		logHandler: handler,
	}
}

// serializeMessage serializes a request message into GraphBinary.
func (gs graphsonSerializer) serializeMessage(request *request) ([]byte, error) {
	finalMessage, err := gs.buildMessage(request.requestID, byte(len(graphsonMimeType)), request.op, request.processor, request.args)
	if err != nil {
		return nil, err
	}
	return finalMessage, nil
}

type Message struct {
	Id        uuid.UUID              `json:"requestId"`
	Op        string                 `json:"op"`
	Processor string                 `json:"processor"`
	Args      map[string]interface{} `json:"args"`
}

func (gs *graphsonSerializer) buildMessage(id uuid.UUID, mimeLen byte, op string, processor string, args map[string]interface{}) ([]byte, error) {
	message := Message{
		Id:        id,
		Op:        op,
		Processor: processor,
		Args:      args,
	}
	result := []byte{mimeLen}
	result = append(result, []byte(graphsonMimeType)...)
	jsonData, err := json.Marshal(message)
	if err != nil {
		return jsonData, err
	}
	result = append(result, jsonData...)
	return result, nil
}

// deserializeMessage deserializes a response message.

type Response struct {
	RequestId string         `json:"requestId"`
	Status    ResponseStatus `json:"status"`
	Result    ResponseResult `json:"result"`
}

type ResponseStatus struct {
	Code       uint16                 `json:"code"`
	Message    string                 `json:"message"`
	Attributes map[string]interface{} `json:"attributes"`
}

type ResponseResult struct {
	Meta map[string]interface{} `json:"meta"`
	Data json.RawMessage        `json:"data"`
}

func (gs graphsonSerializer) deserializeMessage(message []byte) (response, error) {
	var msg response
	var resp Response
	err := json.Unmarshal(message, &resp)
	if err != nil {
		return msg, err
	}
	msg.responseID = uuid.MustParse(resp.RequestId)
	msg.responseStatus.code = resp.Status.Code
	msg.responseStatus.message = resp.Status.Message
	msg.responseStatus.attributes = resp.Status.Attributes
	msg.responseResult.meta = resp.Result.Meta
	msg.responseResult.data = string(resp.Result.Data)

	return msg, nil
}
