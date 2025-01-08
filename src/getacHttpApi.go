package main

import (
	"net/http"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
)

func getacFota(c *gin.Context) {
	Log.Info("RunFOTA")
	file, err := c.FormFile("image_file")
	if err != nil {
		Log.Info("No image_file")
		return
	}

	// Save the uploaded file
	err = c.SaveUploadedFile(file, "/tmp/fota.img")
	if err != nil {
		Log.Info("Fail to run SaveUploadFile")
		return
	}

	go fota()

	// Respond with success message
	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully"})

	Log.Info("getacFota done")
	//c.HTML(http.StatusOK, "fota.page.gohtml", nil)
}

func fota() {
	var isPass = true
	err := FotaExtractFile()
	if err != nil {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/0", "{\"status\":\"failed\"}")
		Log.Info("Wrong IMAGE")
		return
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/0", "{\"status\":\"success\"}")
	}

	Log.Info("========== Run prehookInstall ==========")
	_ = PrehookInstall()

	/*
		Log.Info("========== Run FotaUboot ==========")
		err = FotaUboot()
		if err != nil {
			if err.Error() == "File not found" {
				MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"skip\"}")
			} else {
				MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"failed\"}")
				isPass = false
			}
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"success\"}")
		}
	*/

	Log.Info("========== Run FotaUbootEnv ==========")
	err = FotaUbootEnv()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/1", "{\"status\":\"success\"}")
	}

	//Log.Info("========== Run FotaImagePreHook ==========")
	//FotaImagePreHook()

	Log.Info("========== Run FotaDtb ==========")
	err = FotaDtb()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/2", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/2", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/2", "{\"status\":\"success\"}")
	}

	Log.Info("========== Run FotaKernel ==========")
	err = FotaKernel()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/3", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/3", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/3", "{\"status\":\"success\"}")
	}

	//Log.Info("========== Run FotaImagePostHook ==========")
	//FotaImagePostHook()

	Log.Info("========== Run FotaRootFs ==========")
	err = FotaRootFs()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/4", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/4", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/4", "{\"status\":\"success\"}")
	}

	Log.Info("========== Run FotaDaemon ==========")
	err = FotaDaemon()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/5", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/5", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/5", "{\"status\":\"success\"}")
	}

	Log.Info("========== Run FotaFlash ==========")
	err = FotaFlash()
	if err != nil {
		if err.Error() == "File not found" {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/6", "{\"status\":\"skip\"}")
		} else {
			MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/6", "{\"status\":\"failed\"}")
			isPass = false
		}
	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "status/fota/6", "{\"status\":\"success\"}")
	}

	Log.Info("========== Update FOTA Status ==========")
	if isPass == true {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "fota/info", "{\"status\":\"success\"}")
		cmd := exec.Command("rm", "-rf", "/tmp/fota")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			Log.Infof("remove /tmp/fota: %v", err)
		}
		cmd = exec.Command("rm", "-rf", "/tmp/fota.img")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			Log.Infof("remove /tmp/fota.img: %v", err)
		}
		cmd = exec.Command("/bin/sh", "-c", "echo 0 > /sys/devices/platform/secure-monitor/boot_flag")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			Log.Infof("error to set boot flag: %v", err)
		}
		cmd = exec.Command("/bin/sh", "-c", "reboot")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			Log.Infof("error to reboot: %v", err)
		}

	} else {
		MqttClient.Publish(MQTT_INTERNAL_CLIENT_ID, "fota/info", "{\"status\":\"failed\"}")
	}
}
