package main

import (
	"encoding/json"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Client struct {
	exClient mqtt.Client
	inClient mqtt.Client
	exChoke  chan [2]string
	inChoke  chan [2]string
}

const (
	MQTT_EXTERNAL_TOPIC_REC_CA42A = "status/recording/ca42a"
	MQTT_EXTERNAL_TOPIC_REC_WEB   = "status/recording/web"
	MQTT_EXTERNAL_TOPIC_REC       = "status/recording/#"
	MQTT_INTERNAL_TOPIC_EVENT     = "event"
	MQTT_INTERNAL_TOPIC_REC       = "status/recording/#"
	MQTT_INTERNAL_TOPIC_REC_CA42A = "status/recording/ca42a"
	MQTT_INTERNAL_TOPIC_INFO      = "info"
	MQTT_EXTERNAL_BROKER_URI      = "tcp://127.0.0.1:1883"
	MQTT_INTERNAL_BROKER_URI      = "tcp://127.0.0.1:1883"
	MQTT_EXTERNAL_CLIENT_ID       = "MqttEx"
	MQTT_INTERNAL_CLIENT_ID       = "MqttIn"
)

var BoardInfo DeviceInfo
var MqttClient *Client
var exChoke = make(chan [2]string)
var inChoke = make(chan [2]string)

func MqttNewClient() *Client {
	c := &Client{}
	//c.exClient = createExClient(MQTT_EXTERNAL_BROKER_URI, MQTT_EXTERNAL_CLIENT_ID)
	c.inClient = createInClient(MQTT_INTERNAL_BROKER_URI, MQTT_INTERNAL_CLIENT_ID)
	return c
}

func (m *Client) Publish(clientId, topic, data string) {
	if clientId == MQTT_EXTERNAL_CLIENT_ID {
		Log.Infof("%s->%s(VHA-10)", MQTT_EXTERNAL_CLIENT_ID, data)
		m.exClient.Publish(topic, 0, false, data)
	} else if clientId == MQTT_INTERNAL_CLIENT_ID {
		Log.Infof("%s->%s", MQTT_INTERNAL_CLIENT_ID, data)
		m.inClient.Publish(topic, 0, false, data)
	} else {
		Log.Info("Not identify Mqtt client")
	}
}

func createExClient(brokerIp, id string) mqtt.Client {
	opts := mqtt.NewClientOptions().AddBroker(brokerIp).SetClientID(id)
	opts.SetDefaultPublishHandler(monitorEx)

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		Log.Info(token.Error())
	}

	if token := client.Subscribe(MQTT_EXTERNAL_TOPIC_REC, 0, mqttExHandler); token.Wait() && token.Error() != nil {
		Log.Info(token.Error())
	}

	return client
}

func createInClient(brokerIp, id string) mqtt.Client {
	opts := mqtt.NewClientOptions().AddBroker(brokerIp).SetClientID(id)
	opts.SetDefaultPublishHandler(monitorIn)

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		(token.Error())
	}

	if token := client.Subscribe(MQTT_INTERNAL_TOPIC_INFO, 0, mqttInHandler); token.Wait() && token.Error() != nil {
		Log.Info(token.Error())
	}

	return client
}

func monitorEx(c mqtt.Client, msg mqtt.Message) {
	exChoke <- [2]string{msg.Topic(), string(msg.Payload())}
}

func monitorIn(c mqtt.Client, msg mqtt.Message) {
	inChoke <- [2]string{msg.Topic(), string(msg.Payload())}
}

func mqttInHandler(client mqtt.Client, msg mqtt.Message) {
	Log.Infof("Recv topic: %s, data: %s", msg.Topic(), msg.Payload())
	//var data JsonEvent
	//err := json.Unmarshal(msg.Payload(), &data)
	//if err != nil {
	//	Log.Info("JSON Unmarshall failed")
	//}
	//Log.Info("\tSource: ", data.Source)
	//Log.Info("\tParams: ", data.Params.Cmd)
	//var data JsonEvent
	err := json.Unmarshal(msg.Payload(), &BoardInfo)
	if err != nil {
		Log.Info("JSON Unmarshall failed")
	}

	switch msg.Topic() {
	case MQTT_INTERNAL_TOPIC_INFO:
		msg := MqttMessage{
			Topic:   msg.Topic(),
			Payload: string(msg.Payload()),
		}
		Log.Infof("IPv4:%s", BoardInfo.IPv4)
		Log.Infof("Payload=[%s]", msg.Payload)
		DeviceInfoMsg = msg
		MqttChannel <- msg
	default:
		Log.Info("Source Module not identify")
	}

	/*
		if err := c.ShouldBindJSON(&jsonData); err != nil {
			Log.Info(err.Error())
			c.JSON(400, gin.H{"error": err.Error()})
			//return
		}
		Log.Info("MQTT Packet: ")
		Log.Info("\tTopic: ", jsonData.Topic)
		Log.Info("\tSource: ", jsonData.Source)
		Log.Info("\tDest: ", jsonData.Destination)
		Log.Info("\tRoom: ", jsonData.Room)
		Log.Info("\tParams: ", jsonData.Cmd)
	*/
}

func mqttExHandler(client mqtt.Client, msg mqtt.Message) {
	topic := msg.Topic()
	value := string(msg.Payload())

	switch topic {
	case MQTT_EXTERNAL_TOPIC_REC_CA42A:
		if value == "start" {
			Log.Info("REC ON DONE")
			//MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "REC_ON")
		} else if value == "stop" {
			Log.Info("REC OFF DONE")
			//MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "REC_OFF")
		} else {
			Log.Infof("Unknow cmd=%s", value)
		}
	default:
		Log.Infof("Source Module not identify, topic: %s, message: %s", msg.Topic(), msg.Payload())
	}
}

func StartMqttInLoop() {
	Log.Info("MqttIn Monitor start")
	for {
		incoming := <-inChoke
		Log.Infof("Recv:Topic:%s, Msg:%s\n", incoming[0], incoming[1])
	}
}

func StartMqttExLoop() {
	Log.Info("MqttEx Monitor start")
	for {
		incoming := <-exChoke
		Log.Infof("Recv:Topic:%s, Msg:%s\n", incoming[0], incoming[1])
	}
}

func init() {
	MqttClient = MqttNewClient()
}
