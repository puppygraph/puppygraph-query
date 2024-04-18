package lib

import (
	"bytes"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/sirupsen/logrus"
)

type PuppyLogFormatter struct {
	ModuleName string
}

func (f *PuppyLogFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	var b *bytes.Buffer
	if entry.Buffer != nil {
		b = entry.Buffer
	} else {
		b = &bytes.Buffer{}
	}

	timestamp := entry.Time.Format("2006-01-02 15:04:05")
	b.WriteString(fmt.Sprintf("[%s] [%s] %-5s ", f.ModuleName, timestamp, strings.ToUpper(entry.Level.String())))
	if entry.HasCaller() {
		fName := filepath.Base(entry.Caller.File)
		b.WriteString(fmt.Sprintf("[%s:%d %s] ", fName, entry.Caller.Line, entry.Caller.Function))
	}
	b.WriteString(entry.Message)
	b.WriteByte('\n')
	return b.Bytes(), nil
}
