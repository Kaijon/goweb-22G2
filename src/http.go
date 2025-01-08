package main

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/deepch/vdk/av"
	"github.com/deepch/vdk/format/mp4f"

	"github.com/gin-gonic/gin"
	"golang.org/x/net/websocket"
)

// StreamST struct
type Stream struct {
	URL      string `json:"url"`
	Status   bool   `json:"status"`
	OnDemand bool   `json:"on_demand"`
	RunLock  bool   `json:"-"`
	Codecs   []av.CodecData
	Cl       map[string]viewer
}

type view struct {
	c chan av.Packet
}

var (
	CERT_PEM   = "/mnt/getac/goweb/cert/goweb.mep"
	CERT_KEY   = "/mnt/getac/goweb/cert/goweb.yek"
	folderPath = "/mnt/flash/logger_storage/APLog"
)

var DeviceInfoMsg MqttMessage
var MqttChannel = make(chan MqttMessage, 1)

type DeviceInfo struct {
	FWVersion string `json:"FWVersion"`
	IPv4      string `json:"IPv4"`
	MAC       string `json:"MAC"`
	ModelName string `json:"ModelName"`
	SKUNAME   string `json:"SKUNAME"`
	SerialNo  string `json:"SerialNo"`
}

type MqttMessage struct {
	Topic   string
	Payload string
}

// For shell
var allowedCommands = map[string]bool{
	"ls":    true,
	"pwd":   true,
	"setip": true,
	//"date":   true,
	//"whoami": true,
	//"uptime": true,
	//"df":     true,
	//"ps":     true,
	//"echo":   true,
}

type WSMessage struct {
	Type    string `json:"type"`
	Command string `json:"command"`
}

type WSResponse struct {
	Type   string `json:"type"`
	Output string `json:"output,omitempty"`
	Error  string `json:"error,omitempty"`
}

//End

func serveHTTP() {
	router := gin.Default()
	if Config.Mode == "dbg" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router.LoadHTMLGlob("web/templates/*")
	router.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"status": "ok",
		})
	})
	router.GET("/player/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"status": "ok",
		})
	})
	router.POST("/login", func(c *gin.Context) {
		user := c.Request.FormValue("username")
		pwd := c.Request.FormValue("password")
		if Account.user != user || Account.pwd != pwd {
			Log.Infof("\nWrong Account:[%q:%q] Form:[%q:%q]", Account.user, Account.pwd, user, pwd)
			c.HTML(http.StatusOK, "login_check.html", gin.H{
				"status": "auth fail",
			})
		} else {
			Log.Info("Forward to index.html")
			c.HTML(http.StatusOK, "index.html", gin.H{
				"status": "ok",
			})
		}
	})
	router.GET("/liveview", func(c *gin.Context) {
		fi, all := Config.list()
		Log.Println(fi, all)
		sort.Strings(all)
		c.HTML(http.StatusOK, "liveview.tmpl", gin.H{
			"port":     Config.Server.HTTPPort,
			"suuid":    fi,
			"suuidMap": all,
			"version":  time.Now().String(),
		})
	})
	router.GET("/player/:suuid", func(c *gin.Context) {
		_, all := Config.list()
		Log.Println(all)
		sort.Strings(all)
		c.HTML(http.StatusOK, "liveview.tmpl", gin.H{
			"port":     Config.Server.HTTPPort,
			"suuid":    c.Param("suuid"),
			"suuidMap": all,
			"version":  time.Now().String(),
		})
	})
	router.GET("/ws/:suuid", func(c *gin.Context) {
		handler := websocket.Handler(ws)
		handler.ServeHTTP(c.Writer, c.Request)
	})
	router.POST("/Upgrade", getacFota)
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"status": "oks",
		})
	})
	router.GET("/ws/shell", func(c *gin.Context) {
		handler := websocket.Handler(ShellHandler)
		handler.ServeHTTP(c.Writer, c.Request)
	})
	router.GET("/shell", func(c *gin.Context) {
		c.HTML(http.StatusOK, "shell.html", gin.H{
			"allowedCommands": getAllowedCommands(),
		})
	})

	// Route for file download
	router.GET("/page/download", func(c *gin.Context) {

		var buf bytes.Buffer
		gzipWriter := gzip.NewWriter(&buf)
		tarWriter := tar.NewWriter(gzipWriter)

		err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Get relative path
			relPath, err := filepath.Rel(folderPath, path)
			if err != nil {
				return err
			}

			// Skip the root folder itself
			if relPath == "." {
				return nil
			}

			// Create tar header
			header, err := tar.FileInfoHeader(info, "")
			if err != nil {
				return err
			}

			// Update header name with relative path
			header.Name = relPath

			// Write header
			if err := tarWriter.WriteHeader(header); err != nil {
				return err
			}

			// If it's a file (not a directory), write the content
			if !info.IsDir() {
				file, err := os.Open(path)
				if err != nil {
					return err
				}
				defer file.Close()

				if _, err := io.Copy(tarWriter, file); err != nil {
					return err
				}
			}

			return nil
		})

		if err != nil {
			c.String(http.StatusInternalServerError, "Error creating tar: "+err.Error())
			return
		}

		if err := tarWriter.Close(); err != nil {
			c.String(http.StatusInternalServerError, "Error closing tar writer: "+err.Error())
			return
		}
		if err := gzipWriter.Close(); err != nil {
			c.String(http.StatusInternalServerError, "Error closing gzip writer: "+err.Error())
			return
		}

		timestamp := time.Now().Format("20060102-150405")
		filename := "CANF22-G2-" + timestamp + ".tar.gz"
		encodedFilename := url.QueryEscape(filename)

		// Set headers
		c.Header("Content-Disposition", "attachment; filename="+encodedFilename)
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s; filename*=UTF-8''%s",
			encodedFilename, encodedFilename))
		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Type", "application/gzip")
		c.Header("Content-Length", fmt.Sprintf("%d", buf.Len()))

		// Write the buffer to response
		c.Data(http.StatusOK, "application/gzip", buf.Bytes())

	})

	router.StaticFS("/static", http.Dir("web/static"))
	router.StaticFS("/download", http.Dir("/mnt/flash"))
	//err := router.RunTLS(Config.Server.HTTPPort, CERT_PEM, CERT_KEY)
	err := router.Run(Config.Server.HTTPPort)
	if err != nil {
		Log.Fatalln(err)
	}
}
func ws(ws *websocket.Conn) {
	defer ws.Close()
	suuid := ws.Request().FormValue("suuid")
	Log.Println("Request", suuid)
	//Check if stream exist
	//if !Config.ext(suuid) {
	//	Log.Println("Stream Not Found")
	//	return
	//}
	Config.RunIFNotRun(suuid)
	ws.SetWriteDeadline(time.Now().Add(5 * time.Second))
	cuuid, ch := Config.clAd(suuid)
	Log.Printf("clAd:%v, %v", cuuid, ch)
	defer Config.clDe(suuid, cuuid)
	codecs := Config.coGe(suuid)
	if codecs == nil {
		Log.Println("Codecs Error")
		return
	}
	for i, codec := range codecs {
		Log.Printf("codec : %v", codec)
		if codec.Type().IsAudio() && codec.Type() != av.AAC {
			Log.Println("Track", i, "Audio Codec Work Only AAC")
		}
	}
	muxer := mp4f.NewMuxer(nil)

	err := muxer.WriteHeader(codecs)
	if err != nil {
		Log.Println("muxer.WriteHeader", err)
		return
	}
	meta, init := muxer.GetInit(codecs)
	err = websocket.Message.Send(ws, append([]byte{9}, meta...))
	if err != nil {
		Log.Println("websocket.Message.Send", err)
		return
	}
	err = websocket.Message.Send(ws, init)
	if err != nil {
		return
	}
	var start bool
	go func() {
		for {
			var message string
			err := websocket.Message.Receive(ws, &message)
			if err != nil {
				ws.Close()
				return
			}
		}
	}()
	noVideo := time.NewTimer(10 * time.Second)
	var timeLine = make(map[int8]time.Duration)
	for {
		select {
		case <-noVideo.C:
			Log.Println("noVideo")
			return
		case pck := <-ch:
			if pck.IsKeyFrame {
				noVideo.Reset(10 * time.Second)
				start = true
			}
			if !start {
				continue
			}
			timeLine[pck.Idx] += pck.Duration
			pck.Time = timeLine[pck.Idx]
			ready, buf, _ := muxer.WritePacket(pck, false)
			if ready {
				err = ws.SetWriteDeadline(time.Now().Add(10 * time.Second))
				if err != nil {
					return
				}
				err := websocket.Message.Send(ws, buf)
				if err != nil {
					return
				}
			}
		}
	}
}

func ShellHandler(ws *websocket.Conn) {
	defer ws.Close()

	for {
		var msg WSMessage
		err := websocket.JSON.Receive(ws, &msg)
		if err != nil {
			log.Printf("Websocket receive error: %v", err)
			return
		}

		if msg.Type != "command" {
			response := WSResponse{
				Type:  "error",
				Error: "Invalid message type",
			}
			websocket.JSON.Send(ws, response)
			continue
		}

		// Execute command
		cmdParts := strings.Fields(msg.Command)
		if len(cmdParts) == 0 {
			response := WSResponse{
				Type:  "error",
				Error: "Empty command",
			}
			websocket.JSON.Send(ws, response)
			continue
		}

		baseCmd := cmdParts[0]
		if !allowedCommands[baseCmd] {
			response := WSResponse{
				Type:  "error",
				Error: fmt.Sprintf("Command not allowed. Allowed commands: %v", getAllowedCommands()),
			}
			websocket.JSON.Send(ws, response)
			continue
		}

		cmd := exec.Command(cmdParts[0], cmdParts[1:]...)
		output, err := cmd.CombinedOutput()

		if err != nil {
			response := WSResponse{
				Type:   "error",
				Error:  err.Error(),
				Output: string(output),
			}
			websocket.JSON.Send(ws, response)
			continue
		}

		response := WSResponse{
			Type:   "output",
			Output: string(output),
		}
		websocket.JSON.Send(ws, response)
	}
}

func getAllowedCommands() []string {
	commands := make([]string, 0, len(allowedCommands))
	for cmd := range allowedCommands {
		commands = append(commands, cmd)
	}
	return commands
}
