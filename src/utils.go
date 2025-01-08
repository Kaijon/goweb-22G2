package main

import (
	"bufio"
	"os"
	"os/exec"
	"strings"
)

func GetAccountInfo() {
	cmd := exec.Command("pwd")
	cmd.Env = os.Environ()
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		Log.Infof("fail to run pwd")
	}

	cmd = exec.Command("./web/sh/genAccount.sh")
	err = cmd.Run()
	if err != nil {
		Log.Infof("fail to run genAccount.sh")
	}

	// Open the file
	file, err := os.Open("/tmp/genAccount")
	if err != nil {
		Log.Infof("Error opening file:%s", err)
		return
	}
	defer file.Close()

	// Read the file line by line
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()

		// Remove the trailing '#' and split the content
		cleanedLine := strings.TrimSuffix(line, "#")
		parts := strings.Split(cleanedLine, ":")

		if len(parts) < 3 {
			Log.Infoln("Invalid format")
			continue
		}
		username := parts[0]
		password := parts[2]
		Account.user = username
		Account.pwd = password
		Account.user = strings.Trim(Account.user, "\x00")
		Account.pwd = strings.Trim(Account.pwd, "\x00")
		Log.Infof("\n[Username: %s, Password: %s]", username, password)
	}

	if err := scanner.Err(); err != nil {
		Log.Infof("Error reading file:%s", err)
	}
}
