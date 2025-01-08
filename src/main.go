package main

import (
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"

	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

type account struct {
	user string
	pwd  string
}

var Log = logrus.New()
var Account account

func main() {
	workDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		Log.Fatal(err)
	}
	Log.Infoln("WORKDIR:", workDir)
	out, err := exec.Command("/usr/sbin/iptables -F").Output()
	if err != nil {
		Log.Info(err)
	}
	Log.Infoln("Run iptables -F", out)
	//log.SetFlags(0)
	//log.SetOutput(new(logWriter))
	//LogInit()
	//ListSsdp.Start()
	//go StartSsdpLoop()
	go StartMqttInLoop()
	//go StartMqttExLoop()
	go serveHTTP()
	//KC, disable liveview function for debug
	//go serveStreams()
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		Log.Println(sig)
		done <- true
	}()
	Log.Info("Server Start Awaiting Signal")
	<-done
	Log.Info("Exiting")
}

func init() {
	Log.SetLevel(logrus.DebugLevel)
	Log.SetReportCaller(true)
	Log.SetFormatter(&logrus.TextFormatter{
		TimestampFormat:           "2006-01-02 15:04:05",
		ForceColors:               true,
		EnvironmentOverrideColors: true,
		FullTimestamp:             true,
		DisableLevelTruncation:    true,
	})
	Log.SetOutput(io.MultiWriter(
		os.Stdout,
		&lumberjack.Logger{
			Filename:   "/mnt/flash/logger_storage/APLog/goWeb.log",
			MaxSize:    1, // megabytes
			MaxBackups: 5,
			MaxAge:     1,     //days
			Compress:   false, // disabled by default
		}))
	numProcs := runtime.GOMAXPROCS(0)
	runtime.GOMAXPROCS(numProcs)
	Log.Infoln("GOMAXPROCS set to:", numProcs)
	GetAccountInfo()
	Config.AssignUrl()
}
